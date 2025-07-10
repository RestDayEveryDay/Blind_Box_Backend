const db = require('./database');

const boxes = [
  { name: '龙猫系列', description: '超可爱的龙猫公仔盲盒', imageUrl: 'url1.jpg', probability: 0.5 },
  { name: '甜点系列', description: '像甜品一样的盲盒娃娃', imageUrl: 'url2.jpg', probability: 0.3 },
  { name: '机械战士', description: '机械感满满的收藏盲盒', imageUrl: 'url3.jpg', probability: 0.2 },
];

db.serialize(() => {
  db.run('DELETE FROM boxes');
  const stmt = db.prepare('INSERT INTO boxes (name, description, imageUrl, probability) VALUES (?, ?, ?, ?)');
  for (const box of boxes) {
    stmt.run(box.name, box.description, box.imageUrl, box.probability);
  }
  stmt.finalize(() => {
    console.log('初始化数据成功');
    db.close();
  });
});
