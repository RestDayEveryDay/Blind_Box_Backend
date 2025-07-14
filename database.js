// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'blindbox.db');

console.log('📁 数据库路径:', dbPath);

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
  } else {
    console.log('✅ 数据库连接成功');
    
    // 启用外键约束
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('❌ 启用外键约束失败:', err.message);
      } else {
        console.log('✅ 外键约束已启用');
      }
    });
  }
});

// 数据库错误处理
db.on('error', (err) => {
  console.error('💥 数据库错误:', err);
});

// 优雅关闭数据库连接
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库失败:', err.message);
        reject(err);
      } else {
        console.log('✅ 数据库连接已关闭');
        resolve();
      }
    });
  });
};

// 处理进程退出
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭数据库连接...');
  try {
    await closeDatabase();
  } catch (err) {
    console.error('关闭数据库时出错:', err);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 收到 SIGTERM 信号，正在关闭数据库连接...');
  try {
    await closeDatabase();
  } catch (err) {
    console.error('关闭数据库时出错:', err);
  }
  process.exit(0);
});

module.exports = db;