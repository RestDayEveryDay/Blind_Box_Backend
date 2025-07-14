// create-moments-table.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径（确保路径与你的项目一致）
const dbPath = path.join(__dirname, '../blindbox.db');
console.log('📁 数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

db.serialize(() => {
  console.log('🛠 正在创建 moments 表...');

  // 先删除现有表（如果需要重新创建）
  // db.run('DROP TABLE IF EXISTS moments');

  db.run(`
    CREATE TABLE IF NOT EXISTS moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      imageUrl TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ 创建失败:', err.message);
    } else {
      console.log('✅ moments 表创建成功！');
      
      // 验证表结构
      db.all("PRAGMA table_info(moments)", (err, columns) => {
        if (err) {
          console.error('❌ 获取表结构失败:', err);
        } else {
          console.log('📋 表结构:');
          columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('✅ 数据库连接已关闭');
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