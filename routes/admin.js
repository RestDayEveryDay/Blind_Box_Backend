const express = require('express');
const db = require('../database');
const router = express.Router();

// ===================== 盲盒管理 =====================

// 获取所有盲盒
router.get('/boxes', (req, res) => {
  db.all('SELECT * FROM boxes', (err, rows) => {
    if (err) {
      console.error('❗ 获取盲盒失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ boxes: rows });
  });
});

// 添加盲盒
router.post('/boxes', (req, res) => {
  const { name, description, probability, pool_id } = req.body;

  if (!name || probability == null || !pool_id) {
    return res.status(400).json({ error: '盲盒名称、概率、所属池为必填' });
  }

  db.run(
    'INSERT INTO boxes (name, description, probability, pool_id) VALUES (?, ?, ?, ?)',
    [name, description || '', probability, pool_id],
    function (err) {
      if (err) {
        console.error('❗ 添加盲盒失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ message: '添加成功', boxId: this.lastID });
    }
  );
});

// 删除盲盒
router.delete('/boxes/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM boxes WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('❗ 删除盲盒失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ message: '删除成功' });
  });
});

// 修改盲盒（全字段）
router.put('/boxes/:id', (req, res) => {
  const id = req.params.id;
  const { name, description, probability, pool_id } = req.body;

  if (!name || probability == null || !pool_id) {
    return res.status(400).json({ error: '名称、概率、盲盒池不能为空' });
  }

  db.run(
    'UPDATE boxes SET name = ?, description = ?, probability = ?, pool_id = ? WHERE id = ?',
    [name, description || '', probability, pool_id, id],
    function (err) {
      if (err) {
        console.error('❗ 修改盲盒失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      res.json({ message: '修改成功' });
    }
  );
});

// 获取所有盲盒池
router.get('/pools', (req, res) => {
  db.all('SELECT * FROM box_pools', (err, rows) => {
    if (err) {
      console.error('❗ 获取盲盒池失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ pools: rows });
  });
});

// ===================== 订单管理 =====================

// 获取所有订单（包括用户和盲盒信息）
router.get('/orders', (req, res) => {
  const sql = `
    SELECT orders.id, orders.user_id, orders.box_id, orders.created_at,
           users.username,
           boxes.name AS box_name
    FROM orders
    JOIN users ON orders.user_id = users.id
    JOIN boxes ON orders.box_id = boxes.id
    ORDER BY orders.created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❗ 获取订单失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    res.json({ orders: rows });
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
