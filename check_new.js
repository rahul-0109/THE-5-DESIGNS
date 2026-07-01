const fs = require('fs');
const db = JSON.parse(fs.readFileSync('/home/opc/THE-5-DESIGNS/data/db.json'));
const d = db.diaries.find(d => d.id === '1782899694727');
if (d) {
    console.log(d.content);
} else {
    console.log("Blog not found!");
}
