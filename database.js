const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'blindbox.db'), (err) => {
  if (err) console.error('数据库连接失败:', err);
  else console.log('已连接至 SQLite 数据库');
});

// 初始化表结构
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      imageUrl TEXT,
      probability REAL
    )
  `);
});

module.exports = db;
