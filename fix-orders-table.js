// fix-orders-table.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\fix-orders-table.js
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

console.log('🔧 开始修复 orders 表结构...\n');

db.serialize(() => {
  // 1. 检查当前 orders 表结构
  console.log('1️⃣ 检查当前 orders 表结构...');
  db.all("PRAGMA table_info(orders)", (err, columns) => {
    if (err) {
      console.error('❌ 获取 orders 表结构失败:', err);
      return;
    }

    console.log('📋 当前 orders 表结构:');
    const columnNames = [];
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
      columnNames.push(col.name);
    });

    // 检查是否有 item_id 列
    const hasItemId = columnNames.includes('item_id');

    console.log(`\n📊 检查结果:`);
    if (hasItemId) {
      console.log('✅ item_id 列已存在');
      testOrderCreation();
    } else {
      console.log('❌ item_id 列缺失');
      addItemIdColumn();
    }

    function addItemIdColumn() {
      console.log('\n2️⃣ 添加 item_id 列...');
      
      db.run('ALTER TABLE orders ADD COLUMN item_id INTEGER', (err) => {
        if (err) {
          console.error('❌ 添加 item_id 列失败:', err.message);
          
          // 如果添加列失败，可能需要重建表
          console.log('\n🔄 尝试重建 orders 表...');
          rebuildOrdersTable();
        } else {
          console.log('✅ item_id 列添加成功');
          testOrderCreation();
        }
      });
    }

    function rebuildOrdersTable() {
      console.log('🏗️ 重建 orders 表...');
      
      // 备份现有数据
      db.all('SELECT * FROM orders', (err, existingOrders) => {
        if (err) {
          console.error('❌ 备份现有订单失败:', err);
          return;
        }
        
        console.log(`📦 备份了 ${existingOrders.length} 条现有订单`);
        
        // 删除现有表
        db.run('DROP TABLE IF EXISTS orders', (err) => {
          if (err) {
            console.error('❌ 删除原表失败:', err);
            return;
          }
          
          console.log('🗑️ 原表已删除');
          
          // 创建新表
          db.run(`
            CREATE TABLE orders (
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
              console.error('❌ 创建新表失败:', err);
              return;
            }
            
            console.log('✅ 新 orders 表创建成功');
            
            // 恢复数据（如果有的话）
            if (existingOrders.length > 0) {
              console.log('🔄 恢复现有订单数据...');
              
              let restored = 0;
              existingOrders.forEach(order => {
                // 为旧订单设置默认 item_id（如果没有的话）
                const itemId = order.item_id || null;
                
                db.run(
                  'INSERT INTO orders (id, user_id, box_id, item_id, created_at) VALUES (?, ?, ?, ?, ?)',
                  [order.id, order.user_id, order.box_id, itemId, order.created_at],
                  (err) => {
                    if (err) {
                      console.error(`❌ 恢复订单 ${order.id} 失败:`, err);
                    } else {
                      console.log(`✅ 恢复订单 ${order.id}`);
                    }
                    
                    restored++;
                    if (restored === existingOrders.length) {
                      console.log(`🎉 成功恢复 ${restored} 条订单`);
                      testOrderCreation();
                    }
                  }
                );
              });
            } else {
              testOrderCreation();
            }
          });
        });
      });
    }

    function testOrderCreation() {
      console.log('\n3️⃣ 测试订单创建...');
      
      // 获取测试数据
      db.get('SELECT * FROM users WHERE id = 3', (err, user) => {
        if (err || !user) {
          console.error('❌ 获取测试用户失败');
          finishUp();
          return;
        }
        
        db.get('SELECT * FROM boxes WHERE id = 1', (err, box) => {
          if (err || !box) {
            console.error('❌ 获取测试盲盒失败');
            finishUp();
            return;
          }
          
          db.get('SELECT * FROM items WHERE box_id = 1 LIMIT 1', (err, item) => {
            if (err || !item) {
              console.error('❌ 获取测试物品失败');
              finishUp();
              return;
            }
            
            // 创建测试订单
            const testOrder = {
              user_id: user.id,
              box_id: box.id,
              item_id: item.id,
              created_at: new Date().toISOString()
            };
            
            console.log('📝 创建测试订单:', testOrder);
            
            db.run(
              'INSERT INTO orders (user_id, box_id, item_id, created_at) VALUES (?, ?, ?, ?)',
              [testOrder.user_id, testOrder.box_id, testOrder.item_id, testOrder.created_at],
              function(err) {
                if (err) {
                  console.error('❌ 测试订单创建失败:', err);
                } else {
                  console.log('✅ 测试订单创建成功, ID:', this.lastID);
                  
                  // 测试联表查询
                  db.get(`
                    SELECT orders.*, boxes.name as box_name, boxes.price, 
                           items.name as item_name, items.rarity, items.image_url as item_image
                    FROM orders 
                    LEFT JOIN boxes ON orders.box_id = boxes.id 
                    LEFT JOIN items ON orders.item_id = items.id
                    WHERE orders.id = ?
                  `, [this.lastID], (err, joinResult) => {
                    if (err) {
                      console.error('❌ 联表查询测试失败:', err);
                    } else {
                      console.log('✅ 联表查询测试成功:', {
                        orderId: joinResult.id,
                        boxName: joinResult.box_name,
                        itemName: joinResult.item_name,
                        rarity: joinResult.rarity
                      });
                    }
                    
                    finishUp();
                  });
                }
              }
            );
          });
        });
      });
    }

    function finishUp() {
      console.log('\n4️⃣ 验证最终表结构...');
      
      db.all("PRAGMA table_info(orders)", (err, finalColumns) => {
        if (err) {
          console.error('❌ 验证表结构失败:', err);
        } else {
          console.log('📋 最终 orders 表结构:');
          finalColumns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('\n✅ orders 表修复完成！');
            console.log('\n📋 接下来运行:');
            console.log('   node test-order-creation.js    (重新测试)');
            console.log('   node clean-app.js              (启动服务器)');
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