// scripts/initUsers.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./blindbox.db');
module.exports = db;

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS users`);
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `, () => {
    console.log('✅ 用户表初始化完成');
    db.close();
  });
});
