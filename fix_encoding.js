const fs = require('fs');
const files = ['diaries.html', 'blog-detail.html', 'project.html', 'project-detail.html', 'index.html', 'admin.html'];
files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    let orig = c;
    
    // Fix <img src="${...url...}">
    c = c.replace(/src="\$\{([^}]+)\}"/g, (m, p1) => {
        if ((p1.includes('url') || p1.includes('media_url') || p1.includes('image_url')) && !p1.includes('encodeURI')) {
            return `src="\${encodeURI(${p1})}"`;
        }
        return m;
    });

    // Fix <img src="${...url...} || '...'"> (like diaries.html)
    // Wait, the regex above will capture the whole expression inside ${} which is fine: encodeURI(blog.media_url || '...')
    // But encodeURI might encode the '||' if it's evaluated? No, ${encodeURI(blog.media_url || 'images/default.jpg')} will evaluate the OR first, then encode the result. That's perfect.

    // Fix background-image: url('${...url...}')
    c = c.replace(/url\('\$\{([^}]+)\}'\)/g, (m, p1) => {
        if ((p1.includes('url') || p1.includes('media_url') || p1.includes('image_url')) && !p1.includes('encodeURI')) {
            return `url('\${encodeURI(${p1})}')`;
        }
        return m;
    });

    if (orig !== c) {
        fs.writeFileSync(f, c);
        console.log('Fixed', f);
    }
});
