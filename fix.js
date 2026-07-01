const fs = require('fs');
const file = '/home/opc/THE-5-DESIGNS/data/db.json';
let db = JSON.parse(fs.readFileSync(file));
db.diaries.forEach(d => {
  if (d.media_url && d.media_url.includes('Dining Chair 1.jpg')) {
    d.media_url = 'images/Dining Chair 1.jpg';
  }
});
fs.writeFileSync(file, JSON.stringify(db, null, 2));
