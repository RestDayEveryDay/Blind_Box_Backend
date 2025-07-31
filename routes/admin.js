const express = require('express');
const db = require('../database');
const router = express.Router();

// ===================== 盲盒管理 =====================

// 获取所有物品（新数据结构）
router.get('/boxes', (req, res) => {
  const sql = `
    SELECT items.*, box_pools.name AS pool_name
    FROM items
    JOIN box_pools ON items.pool_id = box_pools.id
    ORDER BY items.created_at DESC
  `;
  
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('❗ 获取物品失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    // 转换为前端期望的格式
    const formattedItems = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      probability: row.drop_rate,
      pool_id: row.pool_id,
      pool_name: row.pool_name,
      rarity: row.rarity
    }));
    
    res.json({ boxes: formattedItems });
  });
});

// 添加物品
router.post('/boxes', (req, res) => {
  const { name, description, probability, pool_id } = req.body;

  if (!name || probability == null || !pool_id) {
    return res.status(400).json({ error: '物品名称、概率、所属池为必填' });
  }

  // 根据概率判断稀有度
  const rarity = probability < 0.1 ? 'hidden' : 'normal';

  db.run(
    'INSERT INTO items (name, description, drop_rate, pool_id, rarity) VALUES (?, ?, ?, ?, ?)',
    [name, description || '', probability, pool_id, rarity],
    function (err) {
      if (err) {
        console.error('❗ 添加物品失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ message: '添加成功', itemId: this.lastID });
    }
  );
});

// 删除物品
router.delete('/boxes/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM items WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('❗ 删除物品失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ message: '删除成功' });
  });
});

// 修改物品（全字段）
router.put('/boxes/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, probability, pool_id } = req.body;

  if (!name || probability == null || !pool_id) {
    return res.status(400).json({ error: '名称、概率、盲盒池不能为空' });
  }

  // 根据概率判断稀有度
  const rarity = probability < 0.1 ? 'hidden' : 'normal';

  db.run(
    'UPDATE items SET name = ?, description = ?, drop_rate = ?, pool_id = ?, rarity = ? WHERE id = ?',
    [name, description || '', probability, pool_id, rarity, id],
    function (err) {
      if (err) {
        console.error('❗ 修改物品失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ message: '修改成功' });
    }
  );
});

// 获取所有盲盒池（按显示顺序排序）
router.get('/pools', (req, res) => {
  db.all('SELECT * FROM box_pools ORDER BY display_order ASC, id ASC', (err, rows) => {
    if (err) {
      console.error('❗ 获取盲盒池失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ pools: rows });
  });
});

// 添加新盲盒池
router.post('/pools', (req, res) => {
  const { name, description, imageUrl } = req.body;

  if (!name) {
    return res.status(400).json({ error: '系列名称不能为空' });
  }

  // 获取当前最大的显示顺序
  db.get('SELECT MAX(display_order) as max_order FROM box_pools', (err, result) => {
    if (err) {
      console.error('❗ 获取最大顺序失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }

    const nextOrder = (result.max_order || 0) + 1;

    db.run(
      'INSERT INTO box_pools (name, description, imageUrl, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', imageUrl || '', nextOrder, 1],
      function (err) {
        if (err) {
          console.error('❗ 添加盲盒池失败:', err);
          return res.status(500).json({ error: '数据库错误' });
        }
        res.json({ message: '添加成功', poolId: this.lastID });
      }
    );
  });
});

// 删除盲盒池
router.delete('/pools/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM box_pools WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('❗ 删除盲盒池失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ message: '删除成功' });
  });
});

// 更新盲盒池状态
router.put('/pools/:id/status', (req, res) => {
  const id = req.params.id;
  const { is_active } = req.body;

  db.run(
    'UPDATE box_pools SET is_active = ? WHERE id = ?',
    [is_active, id],
    function (err) {
      if (err) {
        console.error('❗ 更新盲盒池状态失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ message: '状态更新成功' });
    }
  );
});

// 调整盲盒池显示顺序
router.put('/pools/:id/move', (req, res) => {
  const id = parseInt(req.params.id);
  const { direction } = req.body;

  // 获取当前盲盒池的信息
  db.get('SELECT * FROM box_pools WHERE id = ?', [id], (err, currentPool) => {
    if (err) {
      console.error('❗ 获取当前盲盒池失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }

    if (!currentPool) {
      return res.status(404).json({ error: '盲盒池不存在' });
    }

    let sql;
    if (direction === 'up') {
      // 向上移动：找到当前顺序之前的最大顺序
      sql = 'SELECT * FROM box_pools WHERE display_order < ? ORDER BY display_order DESC LIMIT 1';
    } else {
      // 向下移动：找到当前顺序之后的最小顺序
      sql = 'SELECT * FROM box_pools WHERE display_order > ? ORDER BY display_order ASC LIMIT 1';
    }

    db.get(sql, [currentPool.display_order], (err, targetPool) => {
      if (err) {
        console.error('❗ 获取目标盲盒池失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!targetPool) {
        return res.json({ message: '已经是' + (direction === 'up' ? '第一个' : '最后一个') });
      }

      // 交换显示顺序
      db.serialize(() => {
        db.run('UPDATE box_pools SET display_order = ? WHERE id = ?', [targetPool.display_order, currentPool.id]);
        db.run('UPDATE box_pools SET display_order = ? WHERE id = ?', [currentPool.display_order, targetPool.id]);
      });

      res.json({ message: '顺序调整成功' });
    });
  });
});

// 更新盲盒池基本信息（包括图片） - 必须放在具体路由之后
router.put('/pools/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, image_url } = req.body;

  console.log(`📝 更新盲盒池 ${id}:`, { name, description, image_url });

  if (!name) {
    return res.status(400).json({ error: '盲盒池名称不能为空' });
  }

  db.run(
    'UPDATE box_pools SET name = ?, description = ?, image_url = ? WHERE id = ?',
    [name, description || '', image_url || '', id],
    function (err) {
      if (err) {
        console.error('❗ 更新盲盒池失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: '盲盒池不存在' });
      }
      
      console.log('✅ 盲盒池更新成功');
      res.json({ message: '盲盒池更新成功' });
    }
  );
});

// 获取盲盒池的物品列表
router.get('/pools/:id/items', (req, res) => {
  const poolId = req.params.id;
  
  db.all('SELECT * FROM items WHERE pool_id = ? ORDER BY rarity DESC, id ASC', [poolId], (err, rows) => {
    if (err) {
      console.error('❗ 获取物品列表失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ items: rows });
  });
});

// 为盲盒池添加物品
router.post('/pools/:id/items', (req, res) => {
  const poolId = req.params.id;
  const { name, description, drop_rate, rarity, image_url } = req.body;

  if (!name || drop_rate == null) {
    return res.status(400).json({ error: '物品名称和掉落率不能为空' });
  }

  db.run(
    'INSERT INTO items (pool_id, name, description, drop_rate, rarity, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [poolId, name, description || '', drop_rate, rarity || 'normal', image_url || ''],
    function (err) {
      if (err) {
        console.error('❗ 添加物品失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ message: '添加成功', itemId: this.lastID });
    }
  );
});

// 删除物品
router.delete('/items/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM items WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('❗ 删除物品失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ message: '删除成功' });
  });
});

// ===================== 订单管理 =====================

// 获取所有订单（包括用户和物品信息）
router.get('/orders', (req, res) => {
  const sql = `
    SELECT orders.id, orders.user_id, orders.pool_id, orders.item_id, orders.created_at,
           users.username,
           box_pools.name AS pool_name,
           items.name AS item_name
    FROM orders
    JOIN users ON orders.user_id = users.id
    JOIN box_pools ON orders.pool_id = box_pools.id
    JOIN items ON orders.item_id = items.id
    ORDER BY orders.created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❗ 获取订单失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    // 格式化时间戳
    const formattedOrders = rows.map(row => ({
      ...row,
      timestamp: new Date(row.created_at).toLocaleString('zh-CN')
    }));
    
    res.json({ orders: formattedOrders });
  });
});

// 可选：添加订单（测试用）
router.post('/orders', (req, res) => {
  const { user_id, box_id } = req.body;
  if (!user_id || !box_id) {
    return res.status(400).json({ error: '用户ID和盲盒ID不能为空' });
  }

  db.run(
    'INSERT INTO orders (user_id, box_id) VALUES (?, ?)',
    [user_id, box_id],
    function (err) {
      if (err) {
        console.error('❗ 添加订单失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ message: '订单添加成功', orderId: this.lastID });
    }
  );
});

// 可选：删除订单
router.delete('/orders/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM orders WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('❗ 删除订单失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ message: '订单删除成功' });
  });
});

module.exports = router;
