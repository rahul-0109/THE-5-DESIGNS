const fs = require('fs');
const db = JSON.parse(fs.readFileSync('/home/opc/THE-5-DESIGNS/data/db.json'));
let found = false;
db.diaries.forEach(d => {
    if (d.content && d.content.includes('C:\\\\')) {
        console.log('Found C:\\\\ in', d.id);
        found = true;
    }
    if (d.content && d.content.includes('C:/')) {
        console.log('Found C:/ in', d.id);
        found = true;
    }
});
if (!found) console.log('No local paths found in content.');
