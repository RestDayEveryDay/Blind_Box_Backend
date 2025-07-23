// routes/pool.js - 完整修复版
const express = require('express');
const db = require('../database');
const router = express.Router();

// 获取所有激活的盲盒池（前端首页用）
router.get('/', (req, res) => {
  console.log('📦 获取所有激活的盲盒池');
  
  db.all('SELECT * FROM box_pools WHERE is_active = 1 ORDER BY display_order ASC, id ASC', (err, pools) => {
    if (err) {
      console.error('❗ 获取盲盒池失败:', err);
      return res.status(500).json({ error: '数据库错误: ' + err.message });
    }
    
    console.log(`✅ 成功获取 ${pools.length} 个激活的盲盒池`);
    pools.forEach(pool => {
      console.log(`  - ${pool.name}: ${pool.description || '无描述'} (顺序: ${pool.display_order})`);
    });
    
    res.json({ pools });
  });
});

// 获取盲盒池详情和预览
router.get('/:poolId/preview', (req, res) => {
  const { poolId } = req.params;
  
  console.log('👀 获取盲盒池预览:', poolId);
  
  // 获取盲盒池信息
  db.get('SELECT * FROM box_pools WHERE id = ?', [poolId], (err, pool) => {
    if (err) {
      console.error('❗ 获取盲盒池失败:', err);
      return res.status(500).json({ error: '数据库错误: ' + err.message });
    }
    
    if (!pool) {
      console.log('❌ 盲盒池不存在:', poolId);
      return res.status(404).json({ error: '盲盒池不存在' });
    }
    
    console.log('✅ 找到盲盒池:', pool.name);
    
    // 获取物品列表
    db.all('SELECT * FROM items WHERE pool_id = ? ORDER BY rarity DESC, id', [poolId], (err, items) => {
      if (err) {
        console.error('❗ 获取物品失败:', err);
        return res.status(500).json({ error: '数据库错误: ' + err.message });
      }
      
      const normalItems = items.filter(item => item.rarity === 'normal');
      const hiddenItems = items.filter(item => item.rarity === 'hidden');
      
      console.log(`✅ 盲盒池 "${pool.name}" 预览: ${normalItems.length} 普通款, ${hiddenItems.length} 隐藏款`);
      
      res.json({
        success: true,
        pool: pool,
        preview: {
          normalItems: normalItems,
          hiddenItems: hiddenItems.map(item => ({
            // 隐藏款信息部分隐藏
            id: item.id,
            name: '神秘隐藏款',
            description: '？？？',
            rarity: item.rarity,
            drop_rate: item.drop_rate,
            image_url: 'https://via.placeholder.com/200x200/1a1a1a/ffffff?text=？？？'
          })),
          totalItems: items.length,
          hiddenProbability: hiddenItems.reduce((sum, item) => sum + item.drop_rate, 0) * 100
        }
      });
    });
  });
});

// 盲盒池抽取
router.post('/:poolId/draw', (req, res) => {
  const { poolId } = req.params;
  const { user_id } = req.body;
  
  console.log('\n🎁 ========== 盲盒池抽取 ==========');
  console.log('📝 收到抽取请求:', { user_id, poolId, body: req.body });

  if (!user_id || !poolId) {
    return res.status(400).json({ error: '用户ID和盲盒池ID不能为空' });
  }

  // 验证用户是否存在
  console.log('👤 步骤1: 验证用户...');
  db.get('SELECT id, username FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      console.error('❗ 验证用户失败:', err);
      return res.status(500).json({ error: '数据库错误 - 用户验证: ' + err.message });
    }
    
    if (!user) {
      console.log('❌ 用户不存在:', user_id);
      return res.status(400).json({ error: '用户不存在' });
    }

    console.log('✅ 用户验证成功:', user.username);

    // 获取盲盒池信息
    console.log('📦 步骤2: 获取盲盒池信息...');
    db.get('SELECT * FROM box_pools WHERE id = ?', [poolId], (err, pool) => {
      if (err) {
        console.error('❗ 获取盲盒池信息失败:', err);
        return res.status(500).json({ error: '数据库错误 - 盲盒池查询: ' + err.message });
      }
      
      if (!pool) {
        console.log('❌ 盲盒池不存在:', poolId);
        return res.status(400).json({ error: '盲盒池不存在' });
      }

      console.log('✅ 找到盲盒池:', { id: pool.id, name: pool.name });

      // 获取该盲盒池的所有物品
      console.log('🎁 步骤3: 获取盲盒池物品列表...');
      db.all('SELECT * FROM items WHERE pool_id = ?', [poolId], (err, items) => {
        if (err) {
          console.error('❗ 获取物品列表失败:', err);
          return res.status(500).json({ error: '数据库错误 - 物品查询: ' + err.message });
        }

        console.log(`📋 盲盒池中有 ${items.length} 个物品:`);
        items.forEach(item => {
          console.log(`  - ${item.name} (${item.rarity}, ${(item.drop_rate * 100).toFixed(1)}%)`);
        });

        if (!items || items.length === 0) {
          console.log('❌ 盲盒池中没有物品:', poolId);
          return res.status(400).json({ error: '盲盒池中没有可抽取的物品' });
        }

        // 根据概率进行加权随机抽取
        console.log('🎲 步骤4: 加权随机抽取物品...');
        const selectedItem = weightedRandomSelect(items);
        
        console.log('🎉 抽中物品:', { 
          id: selectedItem.id, 
          name: selectedItem.name, 
          rarity: selectedItem.rarity,
          probability: (selectedItem.drop_rate * 100).toFixed(1) + '%'
        });

        // 创建订单记录
        console.log('💾 步骤5: 创建订单记录...');
        const createdAt = new Date().toISOString();
        
        console.log('📝 准备插入订单:', {
          user_id,
          pool_id: poolId,
          item_id: selectedItem.id,
          created_at: createdAt
        });

        db.run(
          'INSERT INTO orders (user_id, pool_id, item_id, created_at) VALUES (?, ?, ?, ?)',
          [user_id, poolId, selectedItem.id, createdAt],
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
              message: selectedItem.rarity === 'hidden' ? '🎊 恭喜获得隐藏款！' : '✨ 获得新物品！',
              isHidden: selectedItem.rarity === 'hidden',
              orderId: this.lastID,
              pool: {
                id: pool.id,
                name: pool.name,
                description: pool.description
              },
              item: {
                id: selectedItem.id,
                name: selectedItem.name,
                rarity: selectedItem.rarity,
                image_url: selectedItem.image_url,
                description: selectedItem.description,
                drop_rate: selectedItem.drop_rate
              },
              created_at: createdAt
            };

            console.log('🎊 返回抽取结果:', {
              isHidden: result.isHidden,
              itemName: result.item.name,
              rarity: result.item.rarity
            });
            console.log('🎁 ========== 抽取流程完成 ==========\n');
            
            res.json(result);
          }
        );
      });
    });
  });
});

// 加权随机选择函数
function weightedRandomSelect(items) {
  // 计算总权重
  const totalWeight = items.reduce((sum, item) => sum + item.drop_rate, 0);
  
  // 生成随机数
  let random = Math.random() * totalWeight;
  
  // 根据权重选择物品
  for (const item of items) {
    random -= item.drop_rate;
    if (random <= 0) {
      return item;
    }
  }
  
  // 兜底：返回最后一个物品
  return items[items.length - 1];
}

module.exports = router;