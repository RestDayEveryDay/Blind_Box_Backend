// create-orders-table.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'blindbox.db');
console.log('📁 数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

db.serialize(() => {
  console.log('🛠 正在创建 orders 表...');

  // 创建订单表
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      box_id INTEGER NOT NULL,
      item_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(box_id) REFERENCES boxes(id) ON DELETE CASCADE,
      FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('❌ 创建 orders 表失败:', err.message);
    } else {
      console.log('✅ orders 表创建成功！');
    }
  });

  // 创建物品表（如果不存在）
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      box_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      rarity TEXT DEFAULT 'common',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(box_id) REFERENCES boxes(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ 创建 items 表失败:', err.message);
    } else {
      console.log('✅ items 表创建成功！');
    }
  });

  // 检查表结构
  console.log('\n📋 检查数据库表结构...');
  
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ 获取表列表失败:', err);
    } else {
      console.log('📊 现有表:', tables.map(t => t.name).join(', '));
    }
    
    // 检查 orders 表结构
    db.all("PRAGMA table_info(orders)", (err, columns) => {
      if (err) {
        console.error('❌ 获取 orders 表结构失败:', err);
      } else {
        console.log('\n📋 orders 表结构:');
        columns.forEach(col => {
          console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
        });
      }
      
      // 检查 items 表结构
      db.all("PRAGMA table_info(items)", (err, columns) => {
        if (err) {
          console.error('❌ 获取 items 表结构失败:', err);
        } else {
          console.log('\n📋 items 表结构:');
          columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('\n✅ 数据库连接已关闭');
          }
        });
      });
    });
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