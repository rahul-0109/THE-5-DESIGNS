const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml',
};

// Local storage session token
const SESSION_TOKEN = "admin-session-token-998877";

// Helper functions
function readDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch (e) {
        console.error("Error reading database:", e);
        return { config: {}, inquiries: [], diaries: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error writing database:", e);
        return false;
    }
}

function getJsonBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve({});
            }
        });
    });
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function checkAuth(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return false;
    const token = authHeader.replace('Bearer ', '').trim();
    return token === SESSION_TOKEN;
}

function processLocalImagePath(imagePath) {
    if (!imagePath) return "";
    let cleanPath = String(imagePath).trim();
    if (cleanPath.startsWith('"') && cleanPath.endsWith('"')) cleanPath = cleanPath.slice(1, -1);
    if (cleanPath.startsWith("'") && cleanPath.endsWith("'")) cleanPath = cleanPath.slice(1, -1);
    
    if (cleanPath.match(/^[a-zA-Z]:\\/) || cleanPath.match(/^[a-zA-Z]:\//) || cleanPath.startsWith('/Users/') || cleanPath.startsWith('/home/')) {
        try {
            if (fs.existsSync(cleanPath)) {
                const ext = path.extname(cleanPath) || '.jpg';
                const newFileName = 'upload_' + Date.now() + Math.floor(Math.random()*1000) + ext;
                const destDir = path.join(__dirname, 'images');
                if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);
                const destPath = path.join(destDir, newFileName);
                fs.copyFileSync(cleanPath, destPath);
                return 'images/' + newFileName;
            }
        } catch (e) {
            console.error("Failed to copy local image:", e);
        }
    }
    return cleanPath;
}

function injectSEO(htmlStr, pathname, searchParams, db) {
    let title = 'The 5 Designs | Luxury Interior Design Studio';
    let description = 'The 5 Designs is a premium luxury interior design studio offering bespoke architectural and design solutions.';
    let jsonLd = [];

    // Base Organization Schema
    jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'The 5 Designs',
        'image': 'https://the5designs.in/images/upload_1782804127757751.webp',
        'telephone': db.config?.whatsapp_number || '+919492010909',
        'url': 'https://the5designs.in/'
    });

    if (pathname === '/' || pathname === '/index.html') {
        if (db.faqs && db.faqs.length > 0) {
            let faqEntities = db.faqs.filter(f => f.q && f.a).map(f => ({
                '@type': 'Question',
                'name': f.q,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': f.a
                }
            }));
            if (faqEntities.length > 0) {
                jsonLd.push({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    'mainEntity': faqEntities
                });
            }
        }
    } else if (pathname === '/project-detail.html') {
        const pid = searchParams.get('id');
        const project = db.projects?.find(p => p.id === pid);
        if (project) {
            title = project.title + ' | The 5 Designs Portfolio';
            description = project.description || description;
            jsonLd.push({
                '@context': 'https://schema.org',
                '@type': 'CreativeWork',
                'name': project.title,
                'description': project.description,
                'image': project.image_url,
                'author': { '@type': 'Organization', 'name': 'The 5 Designs' }
            });
        }
    } else if (pathname === '/blog-detail.html') {
        const bid = searchParams.get('id');
        const blog = db.diaries?.find(b => b.id === bid);
        if (blog) {
            title = blog.title + ' | The 5 Designs';
            description = blog.content ? blog.content.substring(0, 150).replace(/<[^>]+>/g, '') + '...' : description;
            jsonLd.push({
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                'headline': blog.title,
                'image': blog.media_url,
                'datePublished': blog.created_at || new Date().toISOString(),
                'author': { '@type': 'Person', 'name': blog.author || 'Rahul Sharma' }
            });
        }
    }

    let seoBlock = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <script type="application/ld+json">
    ${JSON.stringify(jsonLd)}
    </script>
    `;

    // Try to replace </title> if it exists, otherwise just inject before </head>
    if (htmlStr.includes('</title>')) {
        htmlStr = htmlStr.replace(/<title>.*?<\/title>/gi, '');
    }
    
    htmlStr = htmlStr.replace('</head>', seoBlock + '</head>');
    
    // Inject dynamic links from DB
    if (db && db.instagram_url) {
        htmlStr = htmlStr.replace(/href="#"(\s+id="instagram_url"|\s+aria-label="Instagram")/g, `href="${db.instagram_url}" target="_blank"$1`);
    }

    return htmlStr;
}

// Server router
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // --- SITEMAP ROUTE ---
    if (pathname === '/sitemap.xml' && method === 'GET') {
        const db = readDB();
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        xml += `<url><loc>https://the5designs.in/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;
        db.projects?.forEach(p => {
            xml += `<url><loc>https://the5designs.in/project-detail.html?id=${p.id}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`;
        });
        db.diaries?.forEach(d => {
            if(d.status === 'published') {
                xml += `<url><loc>https://the5designs.in/blog-detail.html?id=${d.id}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
            }
        });
        xml += `</urlset>`;
        res.writeHead(200, { 'Content-Type': 'application/xml' });
        return res.end(xml);
    }

    // --- API ROUTES ---

    // 0. Sheets Download API
    if (pathname.startsWith('/api/sheets/download') && method === 'GET') {
        const parts = pathname.split('/');
        const sheetName = parts[parts.length - 1];
        const mappedFile = {
            'boq': 'boq_template.xlsx',
            'timeline': 'timeline_template.xlsx',
            'roomwise': 'roomwise_template.xlsx',
            'accounts': 'accounts_template.xlsx',
            'jmc': 'jmc_template.xlsx',
            'vendor_scope': 'vendor_scope_template.xlsx',
            'generic': 'generic_template.xlsx',
            'procurement': 'material_procurement.xlsx',
            'cost_supply': 'cost_comparison_supply.xlsx',
            'cost_services': 'cost_comparison_services.xlsx',
            'contract_terms': 'contract_terms_template.xlsx'
        }[sheetName];

        if (!mappedFile) {
            return sendJSON(res, 404, { success: false, message: "Sheet template not found" });
        }

        const filePath = path.join(__dirname, 'data', 'sheets', mappedFile);
        if (!fs.existsSync(filePath)) {
            return sendJSON(res, 404, { success: false, message: "Sheet file not generated yet" });
        }

        res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=${mappedFile}`
        });
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        return;
    }

    // 1. Authentication Login
    if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await getJsonBody(req);
        const passcode = body.passcode;
        const db = readDB();

        if (passcode && db.config && db.config.admin_password === passcode) {
            return sendJSON(res, 200, { success: true, token: SESSION_TOKEN });
        } else {
            return sendJSON(res, 401, { success: false, message: "Invalid Studio Passcode" });
        }
    }

    // 2. Leads/Inquiries (GET: Protected, POST: Open for test)
    if (pathname === '/api/leads') {
        if (method === 'GET') {
            if (!checkAuth(req)) {
                return sendJSON(res, 403, { success: false, message: "Access Denied" });
            }
            const db = readDB();
            return sendJSON(res, 200, { success: true, data: db.inquiries || [] });
        }
        
        if (method === 'POST') {
            const body = await getJsonBody(req);
            if (!body.name || !body.phone) {
                return sendJSON(res, 400, { success: false, message: "Name and Phone are required" });
            }
            const db = readDB();
            const newLead = {
                id: String(Date.now()),
                created_at: new Date().toISOString(),
                name: body.name,
                phone: body.phone,
                email: body.email || "",
                city: body.city || ""
            };
            db.inquiries.unshift(newLead); // Add to the top
            if (writeDB(db)) {
                return sendJSON(res, 200, { success: true, data: newLead });
            } else {
                return sendJSON(res, 500, { success: false, message: "Database write failure" });
            }
        }
    }

    // FAQs (GET: Open, POST: Protected)
    if (pathname === '/api/faqs') {
        if (method === 'GET') {
            const db = readDB();
            return sendJSON(res, 200, { success: true, data: db.faqs || [] });
        }
        if (method === 'POST') {
            if (!checkAuth(req)) {
                return sendJSON(res, 403, { success: false, message: "Access Denied" });
            }
            const body = await getJsonBody(req);
            if (!body || !Array.isArray(body.faqs)) {
                return sendJSON(res, 400, { success: false, message: "Invalid payload format. Expected { faqs: [...] }" });
            }
            const db = readDB();
            db.faqs = body.faqs;
            if (writeDB(db)) {
                return sendJSON(res, 200, { success: true, message: "FAQs updated successfully" });
            } else {
                return sendJSON(res, 500, { success: false, message: "Database write failure" });
            }
        }
    }

    // 3. Config/Settings (GET: Open, POST: Protected)
    if (pathname === '/api/settings') {
        if (method === 'GET') {
            const db = readDB();
            // Return settings as a list of key-value pairs or raw config object
            return sendJSON(res, 200, { success: true, data: db.config || {} });
        }

        if (method === 'POST') {
            if (!checkAuth(req)) {
                return sendJSON(res, 403, { success: false, message: "Access Denied" });
            }
            const body = await getJsonBody(req); // Expecting array of {key, value} or raw updates object
            const db = readDB();

            if (Array.isArray(body)) {
                body.forEach(item => {
                    if (item.key) {
                        db.config[item.key] = item.value;
                    }
                });
            } else if (typeof body === 'object') {
                Object.keys(body).forEach(key => {
                    db.config[key] = body[key];
                });
            }

            if (writeDB(db)) {
                return sendJSON(res, 200, { success: true, message: "Settings updated successfully" });
            } else {
                return sendJSON(res, 500, { success: false, message: "Database write failure" });
            }
        }
    }

    // 3.5 Projects (GET: Open, POST/PUT/DELETE: Protected)
    if (pathname === '/api/projects') {
        if (method === 'GET') {
            const db = readDB();
            return sendJSON(res, 200, { success: true, data: db.projects || [] });
        }

        if (method === 'POST') {
            if (!checkAuth(req)) return sendJSON(res, 403, { success: false, message: "Access Denied" });
            const body = await getJsonBody(req);
            if (!body.title) return sendJSON(res, 400, { success: false, message: "Title is required" });
            const db = readDB();
            if (!db.projects) db.projects = [];
            const newProject = {
                id: String(Date.now()),
                title: body.title,
                meta: body.meta || "Featured Project",
                description: body.description || "",
                area: body.area || "",
                location: body.location || "",
                image_url: processLocalImagePath(body.image_url || ""),
                spaces: Array.isArray(body.spaces) ? body.spaces.map(s => ({...s, image_url: processLocalImagePath(s.image_url)})) : [],
                created_at: new Date().toISOString()
            };
            db.projects.push(newProject);
            if (writeDB(db)) return sendJSON(res, 200, { success: true, data: newProject });
            else return sendJSON(res, 500, { success: false, message: "Database write failure" });
        }

        if (method === 'PUT') {
            if (!checkAuth(req)) return sendJSON(res, 403, { success: false, message: "Access Denied" });
            const body = await getJsonBody(req);
            if (!body.id) return sendJSON(res, 400, { success: false, message: "ID is required" });
            const db = readDB();
            const index = (db.projects || []).findIndex(p => p.id === body.id);
            if (index !== -1) {
                if (body.image_url) body.image_url = processLocalImagePath(body.image_url);
                if (Array.isArray(body.spaces)) {
                    body.spaces = body.spaces.map(s => ({...s, image_url: processLocalImagePath(s.image_url)}));
                }
                db.projects[index] = { ...db.projects[index], ...body };
                if (writeDB(db)) return sendJSON(res, 200, { success: true, message: "Updated successfully" });
                else return sendJSON(res, 500, { success: false, message: "Database write failure" });
            } else {
                return sendJSON(res, 404, { success: false, message: "Project not found" });
            }
        }

        if (method === 'DELETE') {
            if (!checkAuth(req)) return sendJSON(res, 403, { success: false, message: "Access Denied" });
            const body = await getJsonBody(req);
            if (!body.id) return sendJSON(res, 400, { success: false, message: "ID is required" });
            const db = readDB();
            if (!db.projects) db.projects = [];
            const initialLength = db.projects.length;
            db.projects = db.projects.filter(p => p.id !== body.id);
            if (db.projects.length !== initialLength) {
                if (writeDB(db)) return sendJSON(res, 200, { success: true, message: "Deleted successfully" });
                else return sendJSON(res, 500, { success: false, message: "Database write failure" });
            } else {
                return sendJSON(res, 404, { success: false, message: "Project not found" });
            }
        }
    }

    // 4. Diaries & Vlogs (GET: Open, POST: Protected)
    if (pathname === '/api/diaries') {
        if (method === 'GET') {
            const db = readDB();
            const isAuthenticated = checkAuth(req);
            let diaries = db.diaries || [];
            if (!isAuthenticated) {
                const now = new Date();
                diaries = diaries.filter(d => !d.publish_date || new Date(d.publish_date) <= now);
            }
            return sendJSON(res, 200, { success: true, data: diaries });
        }

        if (method === 'POST') {
            if (!checkAuth(req)) {
                return sendJSON(res, 403, { success: false, message: "Access Denied" });
            }
            const body = await getJsonBody(req);
            if (!body.title || !body.type) {
                return sendJSON(res, 400, { success: false, message: "Title and Type are required" });
            }
            const db = readDB();
            const newDiary = {
                id: String(Date.now()),
                type: body.type, // 'article'
                title: body.title,
                media_url: processLocalImagePath(body.media_url || ""),
                content: body.content || "",
                author: body.author || "Rahul Sharma, Founder - 5",
                keywords: body.keywords || "",
                created_at: new Date().toISOString(),
                publish_date: body.publish_date || new Date().toISOString()
            };
            db.diaries.unshift(newDiary);
            if (writeDB(db)) {
                return sendJSON(res, 200, { success: true, data: newDiary });
            } else {
                return sendJSON(res, 500, { success: false, message: "Database write failure" });
            }
        }

        if (method === 'PUT') {
            if (!checkAuth(req)) return sendJSON(res, 403, { success: false, message: "Access Denied" });
            const body = await getJsonBody(req);
            if (!body.id) return sendJSON(res, 400, { success: false, message: "ID is required" });
            
            const db = readDB();
            const index = db.diaries.findIndex(d => d.id === body.id);
            if (index !== -1) {
                if (body.media_url) body.media_url = processLocalImagePath(body.media_url);
                db.diaries[index] = { ...db.diaries[index], ...body };
                if (writeDB(db)) return sendJSON(res, 200, { success: true, message: "Updated successfully" });
                else return sendJSON(res, 500, { success: false, message: "Database write failure" });
            } else {
                return sendJSON(res, 404, { success: false, message: "Diary not found" });
            }
        }

        if (method === 'DELETE') {
            if (!checkAuth(req)) return sendJSON(res, 403, { success: false, message: "Access Denied" });
            const body = await getJsonBody(req);
            if (!body.id) return sendJSON(res, 400, { success: false, message: "ID is required" });
            
            const db = readDB();
            const initialLength = db.diaries.length;
            db.diaries = db.diaries.filter(d => d.id !== body.id);
            if (db.diaries.length !== initialLength) {
                if (writeDB(db)) return sendJSON(res, 200, { success: true, message: "Deleted successfully" });
                else return sendJSON(res, 500, { success: false, message: "Database write failure" });
            } else {
                return sendJSON(res, 404, { success: false, message: "Diary not found" });
            }
        }
    }

    // --- STATIC FILES SERVING ---
    let decodedPathname;
    try {
        decodedPathname = decodeURIComponent(pathname);
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request: Malformed URI');
        return;
    }
    let filePath = '.' + decodedPathname;
    if (decodedPathname === '/') {
        filePath = './index.html';
    } else if (pathname === '/admin' || pathname === '/admin.html') {
        filePath = './admin.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            let resContent = content;
            if (extname === '.html') {
                const dbData = readDB();
                resContent = injectSEO(content.toString('utf8'), pathname, url.searchParams, dbData);
                // Convert back to buffer to get accurate byte length
                resContent = Buffer.from(resContent, 'utf8');
            }
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Content-Length': resContent.length
            });
            res.end(resContent);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    // Run sheet compiler on startup
    try {
        const generator = require('./scripts/generate_sheets.js');
        generator.main().catch(err => console.error("Error generating sheets on boot:", err));
    } catch (err) {
        console.error("Failed to load generate_sheets.js:", err);
    }
});
