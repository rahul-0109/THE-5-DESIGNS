const fs = require('fs');
const db = JSON.parse(fs.readFileSync('/home/opc/THE-5-DESIGNS/data/db.json'));
db.diaries.forEach(d => console.log(d.id, d.media_url));
