const db = require('./data/db.json');
db.diaries.forEach(d => console.log(`Diary ${d.id}: ${d.title} - media_url: ${d.media_url}`));
