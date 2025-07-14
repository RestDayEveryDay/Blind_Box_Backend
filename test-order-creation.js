// test-order-creation.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\test-order-creation.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'blindbox.db');
console.log('📁 数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

console.log('🧪 开始测试订单创建...\n');

db.serialize(() => {
  // 1. 检查现有数据
  console.log('1️⃣ 检查测试数据...');
  
  db.get('SELECT * FROM users WHERE id = 3', (err, user) => {
    if (err) {
      console.error('❌ 查询用户失败:', err);
      return;
    }
    
    console.log('👤 测试用户:', user ? `ID: ${user.id}, 用户名: ${user.username}` : '不存在');
    
    db.get('SELECT * FROM boxes WHERE id = 1', (err, box) => {
      if (err) {
        console.error('❌ 查询盲盒失败:', err);
        return;
      }
      
      console.log('📦 测试盲盒:', box ? `ID: ${box.id}, 名称: ${box.name}, 价格: ${box.price}` : '不存在');
      
      db.get('SELECT * FROM items WHERE box_id = 1 LIMIT 1', (err, item) => {
        if (err) {
          console.error('❌ 查询物品失败:', err);
          return;
        }
        
        console.log('🎁 测试物品:', item ? `ID: ${item.id}, 名称: ${item.name}, 稀有度: ${item.rarity}` : '不存在');
        
        if (!user || !box || !item) {
          console.log('❌ 缺少测试数据，无法继续测试');
          db.close();
          return;
        }
        
        // 2. 测试订单创建
        console.log('\n2️⃣ 测试订单创建...');
        
        const testOrder = {
          user_id: user.id,
          box_id: box.id,
          item_id: item.id,
          created_at: new Date().toISOString()
        };
        
        console.log('📝 准备插入测试订单:', testOrder);
        
        db.run(
          'INSERT INTO orders (user_id, box_id, item_id, created_at) VALUES (?, ?, ?, ?)',
          [testOrder.user_id, testOrder.box_id, testOrder.item_id, testOrder.created_at],
          function(err) {
            if (err) {
              console.error('❌ 插入订单失败:', err);
              console.error('错误详情:', {
                message: err.message,
                code: err.code,
                errno: err.errno
              });
            } else {
              console.log('✅ 订单创建成功, ID:', this.lastID);
              
              // 验证插入结果
              db.get('SELECT * FROM orders WHERE id = ?', [this.lastID], (err, newOrder) => {
                if (err) {
                  console.error('❌ 验证订单失败:', err);
                } else {
                  console.log('🎉 订单验证成功:', newOrder);
                }
                
                // 3. 测试联表查询
                console.log('\n3️⃣ 测试联表查询...');
                
                db.get(`
                  SELECT orders.*, boxes.name as box_name, boxes.price, 
                         items.name as item_name, items.rarity, items.image_url as item_image
                  FROM orders 
                  LEFT JOIN boxes ON orders.box_id = boxes.id 
                  LEFT JOIN items ON orders.item_id = items.id
                  WHERE orders.id = ?
                `, [this.lastID], (err, joinResult) => {
                  if (err) {
                    console.error('❌ 联表查询失败:', err);
                  } else {
                    console.log('🔗 联表查询成功:', joinResult);
                  }
                  
                  db.close((err) => {
                    if (err) {
                      console.error('❌ 关闭数据库失败:', err.message);
                    } else {
                      console.log('\n✅ 测试完成，数据库连接已关闭');
                    }
                  });
                });
              });
            }
          }
        );
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