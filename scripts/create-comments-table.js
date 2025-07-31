// scripts/create-comments-table.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../blindbox.db');
console.log('📁 数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

console.log('🗃️ 创建评论表...\n');

db.serialize(() => {
  // 创建评论表
  const createCommentsTable = `
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      reply_to_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(moment_id) REFERENCES moments(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(reply_to_id) REFERENCES comments(id) ON DELETE CASCADE
    )
  `;

  db.run(createCommentsTable, (err) => {
    if (err) {
      console.error('❌ 创建评论表失败:', err);
    } else {
      console.log('✅ 评论表创建成功');
      
      // 验证表结构
      db.all("PRAGMA table_info(comments)", (err, info) => {
        if (err) {
          console.error('❌ 获取表信息失败:', err);
        } else {
          console.log('\n📋 评论表结构:');
          info.forEach(column => {
            console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('\n✅ 评论表创建完成，数据库连接已关闭');
            console.log('\n📋 接下来的步骤:');
            console.log('  1. 重启后端服务器');
            console.log('  2. 实现评论相关API');
            console.log('  3. 更新前端朋友圈界面');
          }
        });
      });
    }
  });
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭数据库连接...');
  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库失败:', err.message);
    } else {
      console.log('✅ 数据库连接已关闭');
    }
    process.exit(0);
  });
});