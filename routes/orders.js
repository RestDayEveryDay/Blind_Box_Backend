// routes/orders.js 
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\routes\orders.js
const express = require('express');
const db = require('../database');
const router = express.Router();

// 获取用户的所有订单
router.get('/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: '用户ID无效' });
  }

  console.log(`📦 获取用户订单: ${userId}`);
  
  db.all(
    `SELECT orders.*, boxes.name as box_name, boxes.image_url as box_image, 
            boxes.price, items.name as item_name, items.rarity, items.image_url as item_image
     FROM orders 
     LEFT JOIN boxes ON orders.box_id = boxes.id 
     LEFT JOIN items ON orders.item_id = items.id
     WHERE orders.user_id = ?
     ORDER BY orders.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('❗ 获取用户订单失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      
      console.log(`✅ 成功获取用户 ${userId} 的 ${rows.length} 条订单`);
      res.json({ orders: rows });
    }
  );
});

// 获取用户订单统计
router.get('/stats/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: '用户ID无效' });
  }

  console.log(`📊 获取用户订单统计: ${userId}`);
  
  // 获取基本统计
  db.get(
    `SELECT 
       COUNT(*) as total_orders,
       SUM(boxes.price) as total_spent,
       COUNT(DISTINCT orders.box_id) as unique_boxes
     FROM orders 
     LEFT JOIN boxes ON orders.box_id = boxes.id
     WHERE orders.user_id = ?`,
    [userId],
    (err, basicStats) => {
      if (err) {
        console.error('❗ 获取基本统计失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }

      // 获取稀有度统计
      db.all(
        `SELECT items.rarity, COUNT(*) as count
         FROM orders 
         LEFT JOIN items ON orders.item_id = items.id
         WHERE orders.user_id = ? AND items.rarity IS NOT NULL
         GROUP BY items.rarity
         ORDER BY 
           CASE items.rarity 
             WHEN 'legendary' THEN 1
             WHEN 'epic' THEN 2  
             WHEN 'rare' THEN 3
             WHEN 'common' THEN 4
             ELSE 5
           END`,
        [userId],
        (err, rarityStats) => {
          if (err) {
            console.error('❗ 获取稀有度统计失败:', err);
            return res.status(500).json({ error: '数据库错误' });
          }

          // 获取最近抽取的物品
          db.all(
            `SELECT orders.*, boxes.name as box_name, items.name as item_name, 
                    items.rarity, items.image_url as item_image
             FROM orders 
             LEFT JOIN boxes ON orders.box_id = boxes.id 
             LEFT JOIN items ON orders.item_id = items.id
             WHERE orders.user_id = ?
             ORDER BY orders.created_at DESC
             LIMIT 5`,
            [userId],
            (err, recentItems) => {
              if (err) {
                console.error('❗ 获取最近物品失败:', err);
                return res.status(500).json({ error: '数据库错误' });
              }

              const stats = {
                basic: {
                  totalOrders: basicStats.total_orders || 0,
                  totalSpent: basicStats.total_spent || 0,
                  uniqueBoxes: basicStats.unique_boxes || 0
                },
                rarity: rarityStats,
                recent: recentItems
              };

              console.log(`✅ 成功获取用户 ${userId} 的统计数据`);
              res.json({ stats });
            }
          );
        }
      );
    }
  );
});

// 获取用户最幸运的抽取记录
router.get('/lucky/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: '用户ID无效' });
  }

  console.log(`🍀 获取用户幸运记录: ${userId}`);
  
  db.all(
    `SELECT orders.*, boxes.name as box_name, items.name as item_name, 
            items.rarity, items.image_url as item_image, boxes.price
     FROM orders 
     LEFT JOIN boxes ON orders.box_id = boxes.id 
     LEFT JOIN items ON orders.item_id = items.id
     WHERE orders.user_id = ? AND items.rarity IN ('legendary', 'epic')
     ORDER BY 
       CASE items.rarity 
         WHEN 'legendary' THEN 1
         WHEN 'epic' THEN 2
       END,
       orders.created_at DESC`,
    [userId],
    (err, luckyItems) => {
      if (err) {
        console.error('❗ 获取幸运记录失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      
      console.log(`✅ 成功获取用户 ${userId} 的 ${luckyItems.length} 条幸运记录`);
      res.json({ luckyItems });
    }
  );
});

module.exports = router;