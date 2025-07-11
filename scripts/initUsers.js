// scripts/initUsers.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./blindbox.db');

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS users`);
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    )
  `);

  // 插入一个管理员账号
  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    ['admin', 'admin123', 'admin']
  );

  console.log('✅ 用户表初始化完成，已创建管理员账号 admin/admin123');
  db.close();
});
