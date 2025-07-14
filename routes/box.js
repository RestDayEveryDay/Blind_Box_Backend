// routes/box.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\routes\box.js
const express = require('express');
const db = require('../database');
const router = express.Router();

// 抽盲盒
router.post('/draw', (req, res) => {
  const { user_id, box_id } = req.body;
  
  console.log('\n🎁 ========== 开始抽盒流程 ==========');
  console.log('📝 收到抽盒请求:', { user_id, box_id, body: req.body });

  if (!user_id || !box_id) {
    console.log('❌ 参数验证失败');
    return res.status(400).json({ error: '用户ID和盲盒ID不能为空' });
  }

  // 验证用户是否存在
  console.log('👤 步骤1: 验证用户...');
  db.get('SELECT id, username FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      console.error('❗ 验证用户失败:', err);
      return res.status(500).json({ error: '数据库错误 - 用户验证' });
    }
    
    if (!user) {
      console.log('❌ 用户不存在:', user_id);
      return res.status(400).json({ error: '用户不存在' });
    }

    console.log('✅ 用户验证成功:', user.username);

    // 获取盲盒信息
    console.log('📦 步骤2: 获取盲盒信息...');
    db.get('SELECT * FROM boxes WHERE id = ?', [box_id], (err, box) => {
      if (err) {
        console.error('❗ 获取盲盒信息失败:', err);
        return res.status(500).json({ error: '数据库错误 - 盲盒查询' });
      }
      
      if (!box) {
        console.log('❌ 盲盒不存在:', box_id);
        return res.status(400).json({ error: '盲盒不存在' });
      }

      console.log('✅ 找到盲盒:', { id: box.id, name: box.name, price: box.price });

      // 获取该盲盒的所有物品
      console.log('🎁 步骤3: 获取盲盒物品列表...');
      db.all('SELECT * FROM items WHERE box_id = ?', [box_id], (err, items) => {
        if (err) {
          console.error('❗ 获取物品列表失败:', err);
          return res.status(500).json({ error: '数据库错误 - 物品查询' });
        }

        console.log(`📋 盲盒中有 ${items.length} 个物品:`);
        items.forEach(item => {
          console.log(`  - ${item.name} (${item.rarity})`);
        });

        if (!items || items.length === 0) {
          console.log('❌ 盲盒中没有物品:', box_id);
          return res.status(400).json({ error: '盲盒中没有可抽取的物品' });
        }

        // 根据稀有度权重随机抽取
        console.log('🎲 步骤4: 随机抽取物品...');
        const weightedItems = [];
        items.forEach(item => {
          let weight = 1;
          switch (item.rarity) {
            case 'common': weight = 50; break;
            case 'rare': weight = 30; break;
            case 'epic': weight = 15; break;
            case 'legendary': weight = 5; break;
            default: weight = 25;
          }
          
          for (let i = 0; i < weight; i++) {
            weightedItems.push(item);
          }
        });

        // 随机选择一个物品
        const randomIndex = Math.floor(Math.random() * weightedItems.length);
        const selectedItem = weightedItems[randomIndex];
        
        console.log('🎉 抽中物品:', { 
          id: selectedItem.id, 
          name: selectedItem.name, 
          rarity: selectedItem.rarity 
        });

        // 创建订单记录
        console.log('💾 步骤5: 创建订单记录...');
        const createdAt = new Date().toISOString();
        
        console.log('📝 准备插入订单:', {
          user_id,
          box_id,
          item_id: selectedItem.id,
          created_at: createdAt
        });

        db.run(
          'INSERT INTO orders (user_id, box_id, item_id, created_at) VALUES (?, ?, ?, ?)',
          [user_id, box_id, selectedItem.id, createdAt],
          function (err) {
            if (err) {
              console.error('❗ 创建订单失败:', err);
              console.error('❗ 错误详情:', {
                message: err.message,
                code: err.code,
                errno: err.errno
              });
              return res.status(500).json({ error: '创建订单失败: ' + err.message });
            }

            console.log('✅ 订单创建成功, ID:', this.lastID);

            // 返回抽取结果
            const result = {
              success: true,
              message: '抽取成功！',
              orderId: this.lastID,
              box: {
                id: box.id,
                name: box.name,
                price: box.price
              },
              item: {
                id: selectedItem.id,
                name: selectedItem.name,
                rarity: selectedItem.rarity,
                image_url: selectedItem.image_url,
                description: selectedItem.description
              },
              created_at: createdAt
            };

            console.log('🎊 返回抽取结果:', result);
            console.log('🎁 ========== 抽盒流程完成 ==========\n');
            
            res.json(result);
          }
        );
      });
    });
  });
});

// 获取所有盲盒（用于管理页面）
router.get('/', (req, res) => {
  console.log('📦 获取所有盲盒');
  
  db.all('SELECT * FROM boxes ORDER BY created_at DESC', (err, boxes) => {
    if (err) {
      console.error('❗ 获取盲盒列表失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    console.log(`✅ 成功获取 ${boxes.length} 个盲盒`);
    res.json({ boxes });
  });
});

// 调试端点 - 检查盲盒和物品数据
router.get('/debug/:boxId', (req, res) => {
  const { boxId } = req.params;
  
  console.log('🔍 调试盲盒数据:', boxId);
  
  db.get('SELECT * FROM boxes WHERE id = ?', [boxId], (err, box) => {
    if (err) {
      return res.status(500).json({ error: '查询盲盒失败' });
    }
    
    if (!box) {
      return res.status(404).json({ error: '盲盒不存在' });
    }
    
    db.all('SELECT * FROM items WHERE box_id = ?', [boxId], (err, items) => {
      if (err) {
        return res.status(500).json({ error: '查询物品失败' });
      }
      
      res.json({
        box,
        items,
        itemCount: items.length
      });
    });
  });
});

module.exports = router;