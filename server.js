const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
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

// Server router
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // --- API ROUTES ---

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

    // 4. Diaries & Vlogs (GET: Open, POST: Protected)
    if (pathname === '/api/diaries') {
        if (method === 'GET') {
            const db = readDB();
            return sendJSON(res, 200, { success: true, data: db.diaries || [] });
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
                type: body.type, // 'article' or 'vlog'
                title: body.title,
                media_url: body.media_url || "",
                content: body.content || "",
                created_at: new Date().toISOString()
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
    let filePath = '.' + pathname;
    if (pathname === '/') {
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
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
