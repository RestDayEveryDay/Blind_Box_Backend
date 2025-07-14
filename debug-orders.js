// debug-orders.js - 调试订单API
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\debug-orders.js
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

console.log('🔍 开始调试订单相关数据...\n');

db.serialize(() => {
  // 1. 检查表是否存在
  console.log('1️⃣ 检查数据库表...');
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ 获取表列表失败:', err);
    } else {
      const tableNames = tables.map(t => t.name);
      console.log('📊 现有表:', tableNames.join(', '));
      
      // 检查必需的表
      const requiredTables = ['users', 'boxes', 'items', 'orders'];
      requiredTables.forEach(table => {
        if (tableNames.includes(table)) {
          console.log(`✅ ${table} 表存在`);
        } else {
          console.log(`❌ ${table} 表不存在`);
        }
      });
    }
    
    // 2. 检查用户数据
    console.log('\n2️⃣ 检查用户数据...');
    db.all('SELECT * FROM users LIMIT 5', (err, users) => {
      if (err) {
        console.error('❌ 获取用户失败:', err);
      } else {
        console.log(`👥 用户数量: ${users.length}`);
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, 用户名: ${user.username}`);
        });
      }
      
      // 3. 检查盲盒数据
      console.log('\n3️⃣ 检查盲盒数据...');
      db.all('SELECT * FROM boxes LIMIT 5', (err, boxes) => {
        if (err) {
          console.error('❌ 获取盲盒失败:', err);
        } else {
          console.log(`📦 盲盒数量: ${boxes.length}`);
          boxes.forEach(box => {
            console.log(`  - ID: ${box.id}, 名称: ${box.name}, 价格: ¥${box.price}`);
          });
        }
        
        // 4. 检查物品数据
        console.log('\n4️⃣ 检查物品数据...');
        db.all('SELECT * FROM items LIMIT 10', (err, items) => {
          if (err) {
            console.error('❌ 获取物品失败:', err);
          } else {
            console.log(`🎁 物品数量: ${items.length}`);
            items.forEach(item => {
              console.log(`  - ID: ${item.id}, 名称: ${item.name}, 稀有度: ${item.rarity}, 盲盒ID: ${item.box_id}`);
            });
          }
          
          // 5. 检查订单数据
          console.log('\n5️⃣ 检查订单数据...');
          db.all('SELECT * FROM orders LIMIT 10', (err, orders) => {
            if (err) {
              console.error('❌ 获取订单失败:', err);
            } else {
              console.log(`📋 订单数量: ${orders.length}`);
              orders.forEach(order => {
                console.log(`  - ID: ${order.id}, 用户: ${order.user_id}, 盲盒: ${order.box_id}, 物品: ${order.item_id}`);
              });
            }
            
            // 6. 测试订单统计查询
            console.log('\n6️⃣ 测试订单统计查询...');
            const testUserId = 3; // 使用用户ID 3进行测试
            
            // 基本统计
            db.get(
              `SELECT 
                 COUNT(*) as total_orders,
                 SUM(boxes.price) as total_spent,
                 COUNT(DISTINCT orders.box_id) as unique_boxes
               FROM orders 
               LEFT JOIN boxes ON orders.box_id = boxes.id
               WHERE orders.user_id = ?`,
              [testUserId],
              (err, basicStats) => {
                if (err) {
                  console.error(`❌ 用户 ${testUserId} 基本统计查询失败:`, err);
                } else {
                  console.log(`📊 用户 ${testUserId} 基本统计:`, basicStats);
                }
                
                // 稀有度统计
                db.all(
                  `SELECT items.rarity, COUNT(*) as count
                   FROM orders 
                   LEFT JOIN items ON orders.item_id = items.id
                   WHERE orders.user_id = ? AND items.rarity IS NOT NULL
                   GROUP BY items.rarity`,
                  [testUserId],
                  (err, rarityStats) => {
                    if (err) {
                      console.error(`❌ 用户 ${testUserId} 稀有度统计查询失败:`, err);
                    } else {
                      console.log(`✨ 用户 ${testUserId} 稀有度统计:`, rarityStats);
                    }
                    
                    // 7. 创建测试订单（如果没有的话）
                    if (orders.length === 0 && boxes.length > 0 && items.length > 0) {
                      console.log('\n7️⃣ 创建测试订单...');
                      const testOrder = {
                        user_id: testUserId,
                        box_id: boxes[0].id,
                        item_id: items[0].id
                      };
                      
                      db.run(
                        'INSERT INTO orders (user_id, box_id, item_id) VALUES (?, ?, ?)',
                        [testOrder.user_id, testOrder.box_id, testOrder.item_id],
                        function(err) {
                          if (err) {
                            console.error('❌ 创建测试订单失败:', err);
                          } else {
                            console.log('✅ 创建测试订单成功, ID:', this.lastID);
                          }
                          
                          db.close((err) => {
                            if (err) {
                              console.error('❌ 关闭数据库失败:', err.message);
                            } else {
                              console.log('\n✅ 调试完成，数据库连接已关闭');
                            }
                          });
                        }
                      );
                    } else {
                      db.close((err) => {
                        if (err) {
                          console.error('❌ 关闭数据库失败:', err.message);
                        } else {
                          console.log('\n✅ 调试完成，数据库连接已关闭');
                        }
                      });
                    }
                  }
                );
              }
            );
          });
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