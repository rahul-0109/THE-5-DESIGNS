const fs = require('fs');
const db = JSON.parse(fs.readFileSync('/home/opc/THE-5-DESIGNS/data/db.json'));
const d = db.diaries.find(d => d.media_url === 'images/Dining Chair 1.jpg');
if (d) {
    console.log(d.content);
} else {
    console.log("Blog not found!");
}
