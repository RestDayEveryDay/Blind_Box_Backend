// rebuild-database.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\rebuild-database.js
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

console.log('🔨 开始重构数据库结构...\n');

db.serialize(() => {
  console.log('1️⃣ 备份现有数据...');
  
  // 备份现有的 box_pools 数据
  db.all('SELECT * FROM box_pools', (err, existingPools) => {
    if (err) {
      console.log('⚠️  无法读取现有盲盒池数据:', err.message);
      existingPools = [];
    } else {
      console.log(`📦 备份了 ${existingPools.length} 个现有盲盒池`);
    }

    // 备份现有的 users 数据
    db.all('SELECT * FROM users', (err, existingUsers) => {
      if (err) {
        console.log('⚠️  无法读取现有用户数据:', err.message);
        existingUsers = [];
      } else {
        console.log(`👥 备份了 ${existingUsers.length} 个现有用户`);
      }

      console.log('\n2️⃣ 删除旧表...');
      
      // 删除所有现有表
      const dropTables = [
        'DROP TABLE IF EXISTS orders',
        'DROP TABLE IF EXISTS items', 
        'DROP TABLE IF EXISTS boxes',
        'DROP TABLE IF EXISTS moments'
      ];

      let droppedCount = 0;
      dropTables.forEach((sql, index) => {
        db.run(sql, (err) => {
          if (err) {
            console.error(`❌ 删除表失败:`, err.message);
          } else {
            const tableName = sql.split('EXISTS ')[1];
            console.log(`✅ 删除表: ${tableName}`);
          }
          
          droppedCount++;
          if (droppedCount === dropTables.length) {
            createNewTables(existingPools, existingUsers);
          }
        });
      });
    });
  });

  function createNewTables(existingPools, existingUsers) {
    console.log('\n3️⃣ 创建新表结构...');

    // 创建新的表结构
    const createTableSQLs = [
      // 确保 users 表存在且结构正确
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 确保 box_pools 表存在且结构正确
      `CREATE TABLE IF NOT EXISTS box_pools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 新的 items 表 - 直接属于盲盒池
      `CREATE TABLE items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pool_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        rarity TEXT CHECK(rarity IN ('normal', 'hidden')) DEFAULT 'normal',
        drop_rate REAL DEFAULT 0.95,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(pool_id) REFERENCES box_pools(id) ON DELETE CASCADE
      )`,
      
      // 新的 orders 表 - 简化结构
      `CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pool_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(pool_id) REFERENCES box_pools(id) ON DELETE CASCADE,
        FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE
      )`,
      
      // 重新创建 moments 表
      `CREATE TABLE moments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    let createdCount = 0;
    createTableSQLs.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ 创建表失败:`, err.message);
        } else {
          const tableName = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/)[1];
          console.log(`✅ 创建表: ${tableName}`);
        }
        
        createdCount++;
        if (createdCount === createTableSQLs.length) {
          restoreAndInsertData(existingPools, existingUsers);
        }
      });
    });
  }

  function restoreAndInsertData(existingPools, existingUsers) {
    console.log('\n4️⃣ 恢复和插入数据...');

    // 恢复用户数据
    if (existingUsers.length > 0) {
      console.log('👥 恢复用户数据...');
      let userRestored = 0;
      existingUsers.forEach(user => {
        db.run(
          'INSERT OR REPLACE INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)',
          [user.id, user.username, user.password, user.created_at],
          (err) => {
            if (err) {
              console.error(`❌ 恢复用户 ${user.username} 失败:`, err.message);
            } else {
              console.log(`✅ 恢复用户: ${user.username}`);
            }
            
            userRestored++;
            if (userRestored === existingUsers.length) {
              restorePools(existingPools);
            }
          }
        );
      });
    } else {
      // 创建默认用户
      insertDefaultUsers();
    }

    function insertDefaultUsers() {
      console.log('👥 创建默认用户...');
      const defaultUsers = [
        { username: 'admin', password: 'admin123' },
        { username: '001', password: 'password' },
        { username: '002', password: 'password' }
      ];

      let userCreated = 0;
      defaultUsers.forEach(user => {
        db.run(
          'INSERT INTO users (username, password) VALUES (?, ?)',
          [user.username, user.password],
          (err) => {
            if (err) {
              console.error(`❌ 创建用户 ${user.username} 失败:`, err.message);
            } else {
              console.log(`✅ 创建用户: ${user.username}`);
            }
            
            userCreated++;
            if (userCreated === defaultUsers.length) {
              restorePools(existingPools);
            }
          }
        );
      });
    }

    function restorePools(existingPools) {
      if (existingPools.length > 0) {
        console.log('📦 恢复盲盒池数据...');
        let poolRestored = 0;
        existingPools.forEach(pool => {
          db.run(
            'INSERT OR REPLACE INTO box_pools (id, name, description, image_url, created_at) VALUES (?, ?, ?, ?, ?)',
            [pool.id, pool.name, pool.description, pool.image_url, pool.created_at],
            (err) => {
              if (err) {
                console.error(`❌ 恢复盲盒池 ${pool.name} 失败:`, err.message);
              } else {
                console.log(`✅ 恢复盲盒池: ${pool.name}`);
              }
              
              poolRestored++;
              if (poolRestored === existingPools.length) {
                insertTestItems();
              }
            }
          );
        });
      } else {
        insertDefaultPools();
      }
    }

    function insertDefaultPools() {
      console.log('📦 创建默认盲盒池...');
      const defaultPools = [
        { 
          name: '龙猫系列', 
          description: '宫崎骏经典动画龙猫主题盲盒，收集可爱的龙猫伙伴们',
          image_url: 'https://via.placeholder.com/400x400/4ECDC4/FFFFFF?text=龙猫系列'
        },
        { 
          name: '草莓猫系列', 
          description: '甜美可爱的草莓猫咪盲盒，少女心满满的粉色世界',
          image_url: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=草莓猫'
        },
        { 
          name: '机甲系列', 
          description: '科幻机甲主题盲盒，体验未来科技的魅力',
          image_url: 'https://via.placeholder.com/400x400/45B7D1/FFFFFF?text=机甲系列'
        },
        { 
          name: '宝石系列', 
          description: '闪耀夺目的宝石主题盲盒，每一颗都独一无二',
          image_url: 'https://via.placeholder.com/400x400/96CEB4/FFFFFF?text=宝石系列'
        },
        { 
          name: '星空系列', 
          description: '梦幻星空主题盲盒，探索宇宙的神秘与浪漫',
          image_url: 'https://via.placeholder.com/400x400/DDA0DD/FFFFFF?text=星空系列'
        }
      ];

      let poolCreated = 0;
      defaultPools.forEach(pool => {
        db.run(
          'INSERT INTO box_pools (name, description, image_url) VALUES (?, ?, ?)',
          [pool.name, pool.description, pool.image_url],
          (err) => {
            if (err) {
              console.error(`❌ 创建盲盒池 ${pool.name} 失败:`, err.message);
            } else {
              console.log(`✅ 创建盲盒池: ${pool.name}`);
            }
            
            poolCreated++;
            if (poolCreated === defaultPools.length) {
              insertTestItems();
            }
          }
        );
      });
    }

    function insertTestItems() {
      console.log('\n5️⃣ 创建测试物品数据...');

      // 获取所有盲盒池
      db.all('SELECT * FROM box_pools ORDER BY id', (err, pools) => {
        if (err) {
          console.error('❌ 获取盲盒池失败:', err);
          return;
        }

        console.log(`🎁 为 ${pools.length} 个盲盒池创建物品...`);

        let totalItemsCreated = 0;
        let poolsProcessed = 0;

        pools.forEach(pool => {
          // 为每个盲盒池创建物品
          const items = [
            // 普通款物品 (95%概率)
            {
              name: `${pool.name.replace('系列', '')} - 基础款A`,
              description: `${pool.name}的经典基础款式`,
              rarity: 'normal',
              drop_rate: 0.35,
              image_url: `https://via.placeholder.com/200x200/87CEEB/000000?text=基础A`
            },
            {
              name: `${pool.name.replace('系列', '')} - 基础款B`,
              description: `${pool.name}的另一款基础款式`,
              rarity: 'normal',
              drop_rate: 0.35,
              image_url: `https://via.placeholder.com/200x200/98FB98/000000?text=基础B`
            },
            {
              name: `${pool.name.replace('系列', '')} - 普通款C`,
              description: `${pool.name}的普通款式`,
              rarity: 'normal',
              drop_rate: 0.25,
              image_url: `https://via.placeholder.com/200x200/DDA0DD/000000?text=普通C`
            },
            // 隐藏款物品 (5%概率)
            {
              name: `${pool.name.replace('系列', '')} - 隐藏款★`,
              description: `${pool.name}的超稀有隐藏款，传说中的珍品！`,
              rarity: 'hidden',
              drop_rate: 0.05,
              image_url: `https://via.placeholder.com/200x200/FFD700/000000?text=隐藏★`
            }
          ];

          let itemsForThisPool = 0;
          items.forEach(item => {
            db.run(
              'INSERT INTO items (pool_id, name, description, image_url, rarity, drop_rate) VALUES (?, ?, ?, ?, ?, ?)',
              [pool.id, item.name, item.description, item.image_url, item.rarity, item.drop_rate],
              function(err) {
                if (err) {
                  console.error(`❌ 创建物品失败:`, err.message);
                } else {
                  totalItemsCreated++;
                }
                
                itemsForThisPool++;
                if (itemsForThisPool === items.length) {
                  poolsProcessed++;
                  console.log(`✅ 为 "${pool.name}" 创建了 ${items.length} 个物品`);
                  
                  if (poolsProcessed === pools.length) {
                    finishRebuild(totalItemsCreated);
                  }
                }
              }
            );
          });
        });
      });
    }

    function finishRebuild(totalItems) {
      console.log('\n6️⃣ 验证重构结果...');
      
      // 验证表结构和数据
      const verificationQueries = [
        { name: 'users', query: 'SELECT COUNT(*) as count FROM users' },
        { name: 'box_pools', query: 'SELECT COUNT(*) as count FROM box_pools' },
        { name: 'items', query: 'SELECT COUNT(*) as count FROM items' },
        { name: 'orders', query: 'SELECT COUNT(*) as count FROM orders' }
      ];

      let verified = 0;
      verificationQueries.forEach(({ name, query }) => {
        db.get(query, (err, result) => {
          if (err) {
            console.error(`❌ 验证 ${name} 表失败:`, err.message);
          } else {
            console.log(`✅ ${name} 表: ${result.count} 条记录`);
          }
          
          verified++;
          if (verified === verificationQueries.length) {
            // 显示物品分布
            db.all(
              `SELECT bp.name as pool_name, i.rarity, COUNT(*) as count 
               FROM items i 
               JOIN box_pools bp ON i.pool_id = bp.id 
               GROUP BY bp.name, i.rarity 
               ORDER BY bp.id, i.rarity`,
              (err, distribution) => {
                if (err) {
                  console.error('❌ 获取物品分布失败:', err);
                } else {
                  console.log('\n📊 物品分布统计:');
                  distribution.forEach(row => {
                    const rarityName = row.rarity === 'normal' ? '普通款' : '隐藏款';
                    console.log(`  ${row.pool_name}: ${rarityName} ${row.count} 个`);
                  });
                }
                
                completedRebuild();
              }
            );
          }
        });
      });
    }

    function completedRebuild() {
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('\n🎉 数据库重构完成！');
          console.log('\n📋 新系统特性:');
          console.log('  ✅ 简化的盲盒池 → 物品直接关联');
          console.log('  ✅ 二级稀有度: 普通款(95%) + 隐藏款(5%)');
          console.log('  ✅ 清理了旧的复杂结构');
          console.log('  ✅ 准备好测试数据');
          console.log('\n📋 接下来的步骤:');
          console.log('  1. 重启后端服务器: node clean-app.js');
          console.log('  2. 修改前端抽取逻辑');
          console.log('  3. 实现详情页预览功能');
          console.log('  4. 添加隐藏款特效');
        }
      });
    }
  }
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