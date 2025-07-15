// routes/rankings.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\routes\rankings.js
const express = require('express');
const db = require('../database');
const router = express.Router();

// 计算运气值的函数
const calculateLuckScore = (legendary, epic, rare, common, total) => {
  if (total === 0) return 0;
  
  // 运气值计算公式：传说*100 + 史诗*50 + 稀有*20 + 普通*5，然后除以总数
  const score = (legendary * 100 + epic * 50 + rare * 20 + common * 5) / total;
  return Math.min(score, 100); // 最高100分
};

// 获取欧皇榜（运气好的排名）
router.get('/luck', (req, res) => {
  console.log('🏆 获取欧皇榜');
  
  const query = `
    SELECT 
      u.id as user_id,
      u.username,
      COUNT(o.id) as totalOrders,
      COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) as legendaryCount,
      COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) as epicCount,
      COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) as rareCount,
      COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) as commonCount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LEFT JOIN items i ON o.item_id = i.id
    WHERE o.id IS NOT NULL
    GROUP BY u.id, u.username
    HAVING COUNT(o.id) >= 3
    ORDER BY (
      COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) * 100 + 
      COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) * 50 + 
      COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) * 20 + 
      COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) * 5
    ) * 1.0 / COUNT(o.id) DESC
    LIMIT 50
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('❗ 获取欧皇榜失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    const rankings = rows.map(row => ({
      ...row,
      luckScore: calculateLuckScore(
        row.legendaryCount, 
        row.epicCount, 
        row.rareCount, 
        row.commonCount, 
        row.totalOrders
      )
    }));
    
    console.log(`✅ 成功获取欧皇榜 ${rankings.length} 人`);
    res.json({ rankings });
  });
});

// 获取非酋榜（运气不好的排名）
router.get('/unluck', (req, res) => {
  console.log('💀 获取非酋榜');
  
  const query = `
    SELECT 
      u.id as user_id,
      u.username,
      COUNT(o.id) as totalOrders,
      COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) as legendaryCount,
      COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) as epicCount,
      COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) as rareCount,
      COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) as commonCount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LEFT JOIN items i ON o.item_id = i.id
    WHERE o.id IS NOT NULL
    GROUP BY u.id, u.username
    HAVING COUNT(o.id) >= 5
    ORDER BY (
      COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) * 100 + 
      COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) * 50 + 
      COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) * 20 + 
      COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) * 5
    ) * 1.0 / COUNT(o.id) ASC
    LIMIT 50
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('❗ 获取非酋榜失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    const rankings = rows.map(row => ({
      ...row,
      luckScore: calculateLuckScore(
        row.legendaryCount, 
        row.epicCount, 
        row.rareCount, 
        row.commonCount, 
        row.totalOrders
      )
    }));
    
    console.log(`✅ 成功获取非酋榜 ${rankings.length} 人`);
    res.json({ rankings });
  });
});

// 获取个人排名
router.get('/my-rank/:userId', (req, res) => {
  const { userId } = req.params;
  
  console.log(`👤 获取用户 ${userId} 的排名`);
  
  // 获取个人统计
  const personalQuery = `
    SELECT 
      u.id as user_id,
      u.username,
      COUNT(o.id) as totalOrders,
      COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) as legendaryCount,
      COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) as epicCount,
      COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) as rareCount,
      COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) as commonCount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LEFT JOIN items i ON o.item_id = i.id
    WHERE u.id = ?
    GROUP BY u.id, u.username
  `;
  
  db.get(personalQuery, [userId], (err, personalStats) => {
    if (err) {
      console.error('❗ 获取个人统计失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!personalStats || personalStats.totalOrders === 0) {
      return res.json({
        ranking: {
          luckScore: 0,
          totalOrders: 0,
          luckRank: null,
          unluckRank: null
        }
      });
    }
    
    const luckScore = calculateLuckScore(
      personalStats.legendaryCount,
      personalStats.epicCount,
      personalStats.rareCount,
      personalStats.commonCount,
      personalStats.totalOrders
    );
    
    // 获取在欧皇榜的排名
    const luckRankQuery = `
      WITH RankedUsers AS (
        SELECT 
          u.id as user_id,
          ROW_NUMBER() OVER (
            ORDER BY (
              COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) * 100 + 
              COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) * 50 + 
              COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) * 20 + 
              COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) * 5
            ) * 1.0 / COUNT(o.id) DESC
          ) as luck_rank
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN items i ON o.item_id = i.id
        WHERE o.id IS NOT NULL
        GROUP BY u.id
        HAVING COUNT(o.id) >= 3
      )
      SELECT luck_rank FROM RankedUsers WHERE user_id = ?
    `;
    
    db.get(luckRankQuery, [userId], (err, luckRank) => {
      if (err) {
        console.error('❗ 获取欧皇榜排名失败:', err);
      }
      
      // 获取在非酋榜的排名
      const unluckRankQuery = `
        WITH RankedUsers AS (
          SELECT 
            u.id as user_id,
            ROW_NUMBER() OVER (
              ORDER BY (
                COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) * 100 + 
                COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) * 50 + 
                COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) * 20 + 
                COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) * 5
              ) * 1.0 / COUNT(o.id) ASC
            ) as unluck_rank
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          LEFT JOIN items i ON o.item_id = i.id
          WHERE o.id IS NOT NULL
          GROUP BY u.id
          HAVING COUNT(o.id) >= 5
        )
        SELECT unluck_rank FROM RankedUsers WHERE user_id = ?
      `;
      
      db.get(unluckRankQuery, [userId], (err, unluckRank) => {
        if (err) {
          console.error('❗ 获取非酋榜排名失败:', err);
        }
        
        const ranking = {
          luckScore,
          totalOrders: personalStats.totalOrders,
          legendaryCount: personalStats.legendaryCount,
          epicCount: personalStats.epicCount,
          rareCount: personalStats.rareCount,
          commonCount: personalStats.commonCount,
          luckRank: luckRank?.luck_rank || null,
          unluckRank: unluckRank?.unluck_rank || null
        };
        
        console.log(`✅ 成功获取用户 ${userId} 的排名信息`);
        res.json({ ranking });
      });
    });
  });
});

// 获取排名统计信息
router.get('/stats', (req, res) => {
  console.log('📊 获取排名统计');
  
  // 基础统计
  const basicStatsQuery = `
    SELECT 
      COUNT(DISTINCT u.id) as totalUsers,
      COUNT(o.id) as totalOrders,
      COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) as legendaryCount,
      COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) as epicCount,
      COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) as rareCount,
      COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) as commonCount
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    LEFT JOIN items i ON o.item_id = i.id
  `;
  
  db.get(basicStatsQuery, (err, basicStats) => {
    if (err) {
      console.error('❗ 获取基础统计失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    // 稀有度分布
    const rarityQuery = `
      SELECT 
        i.rarity,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders o2 JOIN items i2 ON o2.item_id = i2.id), 1) as percentage
      FROM orders o
      JOIN items i ON o.item_id = i.id
      GROUP BY i.rarity
      ORDER BY 
        CASE i.rarity 
          WHEN 'legendary' THEN 1
          WHEN 'epic' THEN 2
          WHEN 'rare' THEN 3
          WHEN 'common' THEN 4
        END
    `;
    
    db.all(rarityQuery, (err, rarityDistribution) => {
      if (err) {
        console.error('❗ 获取稀有度分布失败:', err);
        rarityDistribution = [];
      }
      
      // 运气等级分布
      const luckLevelsQuery = `
        WITH UserLuckScores AS (
          SELECT 
            u.id,
            CASE 
              WHEN COUNT(o.id) = 0 THEN 0
              ELSE (
                COUNT(CASE WHEN i.rarity = 'legendary' THEN 1 END) * 100 + 
                COUNT(CASE WHEN i.rarity = 'epic' THEN 1 END) * 50 + 
                COUNT(CASE WHEN i.rarity = 'rare' THEN 1 END) * 20 + 
                COUNT(CASE WHEN i.rarity = 'common' THEN 1 END) * 5
              ) * 1.0 / COUNT(o.id)
            END as luckScore
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          LEFT JOIN items i ON o.item_id = i.id
          GROUP BY u.id
        )
        SELECT 
          CASE 
            WHEN luckScore >= 80 THEN '欧皇'
            WHEN luckScore >= 60 THEN '欧洲人'
            WHEN luckScore >= 40 THEN '平民'
            WHEN luckScore >= 20 THEN '非洲人'
            ELSE '非酋'
          END as level,
          CASE 
            WHEN luckScore >= 80 THEN '👑'
            WHEN luckScore >= 60 THEN '😊'
            WHEN luckScore >= 40 THEN '😐'
            WHEN luckScore >= 20 THEN '😭'
            ELSE '💀'
          END as icon,
          COUNT(*) as count
        FROM UserLuckScores
        WHERE luckScore > 0
        GROUP BY 
          CASE 
            WHEN luckScore >= 80 THEN '欧皇'
            WHEN luckScore >= 60 THEN '欧洲人'
            WHEN luckScore >= 40 THEN '平民'
            WHEN luckScore >= 20 THEN '非洲人'
            ELSE '非酋'
          END
        ORDER BY 
          CASE 
            WHEN luckScore >= 80 THEN 1
            WHEN luckScore >= 60 THEN 2
            WHEN luckScore >= 40 THEN 3
            WHEN luckScore >= 20 THEN 4
            ELSE 5
          END
      `;
      
      db.all(luckLevelsQuery, (err, luckLevels) => {
        if (err) {
          console.error('❗ 获取运气等级分布失败:', err);
          luckLevels = [];
        }
        
        const stats = {
          totalUsers: basicStats.totalUsers || 0,
          totalOrders: basicStats.totalOrders || 0,
          legendaryCount: basicStats.legendaryCount || 0,
          epicCount: basicStats.epicCount || 0,
          rareCount: basicStats.rareCount || 0,
          commonCount: basicStats.commonCount || 0,
          rarityDistribution,
          luckLevels
        };
        
        console.log(`✅ 成功获取排名统计`);
        res.json({ stats });
      });
    });
  });
});

// 获取最新的幸运事件
router.get('/recent-luck', (req, res) => {
  console.log('🍀 获取最新幸运事件');
  
  const query = `
    SELECT 
      u.username,
      i.name as item_name,
      i.rarity,
      i.image_url,
      b.name as box_name,
      o.created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    JOIN items i ON o.item_id = i.id
    JOIN boxes b ON o.box_id = b.id
    WHERE i.rarity IN ('legendary', 'epic')
    ORDER BY o.created_at DESC
    LIMIT 20
  `;
  
  db.all(query, (err, events) => {
    if (err) {
      console.error('❗ 获取幸运事件失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    console.log(`✅ 成功获取 ${events.length} 个幸运事件`);
    res.json({ events });
  });
});

module.exports = router;