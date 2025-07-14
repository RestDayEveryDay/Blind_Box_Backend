const express = require('express');
const db = require('../database');
const router = express.Router();

// 获取所有动态
router.get('/', (req, res) => {
  console.log('📖 获取动态列表请求');
  
  db.all(
    `SELECT moments.*, users.username 
     FROM moments 
     JOIN users ON moments.user_id = users.id 
     ORDER BY moments.created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('❗ 获取动态失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      
      console.log(`✅ 成功获取 ${rows.length} 条动态`);
      res.json({ moments: rows });
    }
  );
});

// 发布动态
router.post('/', (req, res) => {
  console.log('📝 发布动态请求:', req.body);
  
  const { user_id, content, imageUrl } = req.body;

  // 验证必填字段
  if (!user_id || !content) {
    console.log('❌ 验证失败: 缺少必填字段');
    return res.status(400).json({ error: '内容或用户ID不能为空' });
  }

  // 验证用户是否存在
  db.get('SELECT id FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      console.error('❗ 验证用户失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      console.log('❌ 用户不存在:', user_id);
      return res.status(400).json({ error: '用户不存在' });
    }

    const createdAt = new Date().toISOString();
    
    db.run(
      'INSERT INTO moments (user_id, content, imageUrl, created_at) VALUES (?, ?, ?, ?)',
      [user_id, content, imageUrl || '', createdAt],
      function (err) {
        if (err) {
          console.error('❗ 发布动态失败:', err);
          return res.status(500).json({ error: '数据库错误' });
        }
        
        console.log('✅ 动态发布成功, ID:', this.lastID);
        res.json({ 
          message: '发布成功', 
          momentId: this.lastID,
          moment: {
            id: this.lastID,
            user_id,
            content,
            imageUrl: imageUrl || '',
            created_at: createdAt
          }
        });
      }
    );
  });
});

// 删除动态 - 使用数字参数而不是通配符
router.delete('/delete/:id', (req, res) => {
  const momentId = parseInt(req.params.id);
  const { user_id } = req.body;

  console.log(`🗑️  删除动态请求: ${momentId}, 用户: ${user_id}`);

  if (!user_id) {
    return res.status(400).json({ error: '用户ID不能为空' });
  }

  if (!momentId || isNaN(momentId)) {
    return res.status(400).json({ error: '动态ID无效' });
  }

  // 验证是否是动态的发布者
  db.get(
    'SELECT user_id FROM moments WHERE id = ?',
    [momentId],
    (err, moment) => {
      if (err) {
        console.error('❗ 查询动态失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!moment) {
        return res.status(404).json({ error: '动态不存在' });
      }

      if (moment.user_id !== parseInt(user_id)) {
        return res.status(403).json({ error: '无权限删除此动态' });
      }

      db.run('DELETE FROM moments WHERE id = ?', [momentId], function (err) {
        if (err) {
          console.error('❗ 删除动态失败:', err);
          return res.status(500).json({ error: '数据库错误' });
        }

        console.log('✅ 动态删除成功, ID:', momentId);
        res.json({ message: '删除成功' });
      });
    }
  );
});

// 获取用户的动态
router.get('/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  
  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: '用户ID无效' });
  }

  console.log(`👤 获取用户动态: ${userId}`);
  
  db.all(
    `SELECT moments.*, users.username 
     FROM moments 
     JOIN users ON moments.user_id = users.id 
     WHERE moments.user_id = ?
     ORDER BY moments.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('❗ 获取用户动态失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      
      console.log(`✅ 成功获取用户 ${userId} 的 ${rows.length} 条动态`);
      res.json({ moments: rows });
    }
  );
});

module.exports = router;