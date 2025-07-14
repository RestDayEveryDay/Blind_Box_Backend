// insert-test-items.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\insert-test-items.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'blindbox.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('🎁 开始插入测试物品...');

  // 先查看现有的盲盒
  db.all('SELECT * FROM boxes', (err, boxes) => {
    if (err) {
      console.error('❌ 获取盲盒失败:', err);
      return;
    }

    console.log(`📦 找到 ${boxes.length} 个盲盒`);
    
    if (boxes.length === 0) {
      console.log('⚠️  没有盲盒，请先创建盲盒');
      db.close();
      return;
    }

    // 为每个盲盒创建一些测试物品
    boxes.forEach((box, boxIndex) => {
      console.log(`\n🎁 为盲盒 "${box.name}" (ID: ${box.id}) 创建物品...`);
      
      const testItems = [
        {
          name: `${box.name} - 普通玩偶`,
          description: '可爱的普通玩偶',
          rarity: 'common',
          image_url: 'https://via.placeholder.com/100x100/87CEEB/000000?text=普通'
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
        },
        {
          name: `${box.name} - 普通贴纸`,
          description: '可爱的普通贴纸',
          rarity: 'common',
          image_url: 'https://via.placeholder.com/100x100/87CEEB/000000?text=贴纸'
        }
      ];

      testItems.forEach((item, itemIndex) => {
        db.run(
          'INSERT INTO items (box_id, name, description, image_url, rarity) VALUES (?, ?, ?, ?, ?)',
          [box.id, item.name, item.description, item.image_url, item.rarity],
          function(err) {
            if (err) {
              console.error(`❌ 插入物品失败:`, err.message);
            } else {
              console.log(`✅ 创建物品: ${item.name} (${item.rarity})`);
            }
            
            // 如果是最后一个盒子的最后一个物品，关闭数据库
            if (boxIndex === boxes.length - 1 && itemIndex === testItems.length - 1) {
              setTimeout(() => {
                // 验证插入结果
                db.all('SELECT COUNT(*) as count FROM items', (err, result) => {
                  if (err) {
                    console.error('❌ 验证失败:', err);
                  } else {
                    console.log(`\n🎉 总共创建了 ${result[0].count} 个物品`);
                  }
                  
                  db.close((err) => {
                    if (err) {
                      console.error('❌ 关闭数据库失败:', err.message);
                    } else {
                      console.log('✅ 数据库连接已关闭');
                    }
                  });
                });
              }, 100);
            }
          }
        );
      });
    });
  });
});