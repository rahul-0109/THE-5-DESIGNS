const fs = require('fs');
const db = JSON.parse(fs.readFileSync('/home/opc/THE-5-DESIGNS/data/db.json'));
const d = db.diaries.find(d => d.id === '1782899694727');
if (d) {
    const matches = d.content.match(/<img[^>]+src=["'](.*?)["']/g);
    if (matches) {
        matches.forEach(m => {
            if (!m.includes('base64')) {
                console.log("Found non-base64 image:", m);
            }
        });
    }
}
