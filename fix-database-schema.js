// fix-database-schema.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\fix-database-schema.js
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

db.serialize(() => {
  console.log('🔧 开始修复数据库结构...\n');

  // 1. 检查当前 boxes 表结构
  console.log('1️⃣ 检查当前 boxes 表结构...');
  db.all("PRAGMA table_info(boxes)", (err, columns) => {
    if (err) {
      console.error('❌ 获取 boxes 表结构失败:', err);
      return;
    }

    console.log('📋 当前 boxes 表结构:');
    const columnNames = [];
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
      columnNames.push(col.name);
    });

    // 检查是否有 price 列
    const hasPrice = columnNames.includes('price');
    const hasDescription = columnNames.includes('description');
    const hasImageUrl = columnNames.includes('image_url');
    const hasPoolId = columnNames.includes('pool_id');

    console.log(`\n📊 缺失的列:`);
    if (!hasPrice) console.log('❌ price 列缺失');
    if (!hasDescription) console.log('❌ description 列缺失');
    if (!hasImageUrl) console.log('❌ image_url 列缺失');
    if (!hasPoolId) console.log('❌ pool_id 列缺失');

    // 2. 添加缺失的列
    console.log('\n2️⃣ 添加缺失的列...');
    
    const addColumns = [];
    if (!hasPrice) addColumns.push('ALTER TABLE boxes ADD COLUMN price DECIMAL(10,2) DEFAULT 0');
    if (!hasDescription) addColumns.push('ALTER TABLE boxes ADD COLUMN description TEXT');
    if (!hasImageUrl) addColumns.push('ALTER TABLE boxes ADD COLUMN image_url TEXT');
    if (!hasPoolId) addColumns.push('ALTER TABLE boxes ADD COLUMN pool_id INTEGER');

    let completed = 0;
    const total = addColumns.length;

    if (addColumns.length === 0) {
      console.log('✅ boxes 表结构完整，无需修改');
      createItemsTable();
    } else {
      addColumns.forEach((sql, index) => {
        db.run(sql, (err) => {
          if (err) {
            console.error(`❌ 添加列失败:`, err.message);
          } else {
            console.log(`✅ 列添加成功: ${sql.split('ADD COLUMN ')[1].split(' ')[0]}`);
          }
          
          completed++;
          if (completed === total) {
            // 更新现有盲盒的默认价格
            updateBoxPrices();
          }
        });
      });
    }

    function updateBoxPrices() {
      console.log('\n3️⃣ 更新现有盲盒的默认价格...');
      
      // 为现有盲盒设置随机价格
      db.all('SELECT id, name FROM boxes WHERE price = 0 OR price IS NULL', (err, boxes) => {
        if (err) {
          console.error('❌ 获取盲盒失败:', err);
          createItemsTable();
          return;
        }

        if (boxes.length === 0) {
          console.log('✅ 所有盲盒都有价格');
          createItemsTable();
          return;
        }

        let updated = 0;
        boxes.forEach(box => {
          // 设置随机价格 10-50 元
          const randomPrice = Math.floor(Math.random() * 41) + 10;
          
          db.run('UPDATE boxes SET price = ?, description = ? WHERE id = ?', 
            [randomPrice, `${box.name}系列盲盒，内含神秘物品`, box.id], 
            (err) => {
              if (err) {
                console.error(`❌ 更新盲盒 ${box.name} 价格失败:`, err);
              } else {
                console.log(`✅ 更新盲盒 "${box.name}" 价格: ¥${randomPrice}`);
              }
              
              updated++;
              if (updated === boxes.length) {
                createItemsTable();
              }
            }
          );
        });
      });
    }

    function createItemsTable() {
      console.log('\n4️⃣ 创建 items 表...');
      
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
        
        // 5. 插入测试物品
        insertTestItems();
      });
    }

    function insertTestItems() {
      console.log('\n5️⃣ 插入测试物品...');
      
      // 获取所有盲盒
      db.all('SELECT * FROM boxes', (err, boxes) => {
        if (err) {
          console.error('❌ 获取盲盒失败:', err);
          finishUp();
          return;
        }

        if (boxes.length === 0) {
          console.log('⚠️  没有盲盒，跳过物品创建');
          finishUp();
          return;
        }

        console.log(`📦 为 ${boxes.length} 个盲盒创建物品...`);

        let totalItemsCreated = 0;
        let boxesProcessed = 0;

        boxes.forEach((box) => {
          const testItems = [
            {
              name: `${box.name} - 普通玩偶`,
              description: '可爱的普通玩偶',
              rarity: 'common',
              image_url: 'https://via.placeholder.com/100x100/87CEEB/000000?text=普通'
            },
            {
              name: `${box.name} - 普通贴纸`,
              description: '精美贴纸',
              rarity: 'common',
              image_url: 'https://via.placeholder.com/100x100/87CEEB/000000?text=贴纸'
            },
            {
              name: `${box.name} - 稀有手办`,
              description: '精美的稀有手办',
              rarity: 'rare',
              image_url: 'https://via.placeholder.com/100x100/4169E1/FFFFFF?text=稀有'
            },
            {
              name: `${box.name} - 史诗徽章`,
              description: '闪闪发光的史诗徽章',
              rarity: 'epic',
              image_url: 'https://via.placeholder.com/100x100/8A2BE2/FFFFFF?text=史诗'
            },
            {
              name: `${box.name} - 传说宝石`,
              description: '传说级的稀世宝石',
              rarity: 'legendary',
              image_url: 'https://via.placeholder.com/100x100/FFD700/000000?text=传说'
            }
          ];

          let itemsForThisBox = 0;
          testItems.forEach((item) => {
            db.run(
              'INSERT INTO items (box_id, name, description, image_url, rarity) VALUES (?, ?, ?, ?, ?)',
              [box.id, item.name, item.description, item.image_url, item.rarity],
              function(err) {
                if (err) {
                  console.error(`❌ 插入物品失败:`, err.message);
                } else {
                  totalItemsCreated++;
                }
                
                itemsForThisBox++;
                if (itemsForThisBox === testItems.length) {
                  boxesProcessed++;
                  console.log(`✅ 为盲盒 "${box.name}" 创建了 ${testItems.length} 个物品`);
                  
                  if (boxesProcessed === boxes.length) {
                    console.log(`\n🎉 总共创建了 ${totalItemsCreated} 个物品`);
                    finishUp();
                  }
                }
              }
            );
          });
        });
      });
    }

    function finishUp() {
      console.log('\n6️⃣ 验证修复结果...');
      
      // 验证 boxes 表
      db.all('SELECT id, name, price, description FROM boxes LIMIT 3', (err, boxes) => {
        if (err) {
          console.error('❌ 验证 boxes 表失败:', err);
        } else {
          console.log('📦 修复后的盲盒数据:');
          boxes.forEach(box => {
            console.log(`  - ${box.name}: ¥${box.price} - ${box.description}`);
          });
        }
        
        // 验证 items 表
        db.all('SELECT COUNT(*) as count FROM items', (err, result) => {
          if (err) {
            console.error('❌ 验证 items 表失败:', err);
          } else {
            console.log(`🎁 物品总数: ${result[0].count}`);
          }
          
          db.close((err) => {
            if (err) {
              console.error('❌ 关闭数据库失败:', err.message);
            } else {
              console.log('\n✅ 数据库修复完成！');
              console.log('\n📋 接下来运行:');
              console.log('   node debug-orders.js    (再次验证)');
              console.log('   node clean-app.js       (启动服务器)');
            }
          });
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