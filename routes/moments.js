const express = require('express');
const db = require('../database');
const router = express.Router();

// 获取所有动态（公告优先显示）
router.get('/', (req, res) => {
  console.log('📖 获取动态列表请求');
  
  db.all(
    `SELECT moments.*, users.username, users.role
     FROM moments 
     JOIN users ON moments.user_id = users.id 
     ORDER BY 
       CASE WHEN users.role = 'admin' THEN 0 ELSE 1 END,
       moments.created_at DESC`,
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

// ===================== 评论相关API =====================

// 获取动态的所有评论
router.get('/:momentId/comments', (req, res) => {
  const { momentId } = req.params;
  
  console.log(`💬 获取动态 ${momentId} 的评论`);
  
  if (!momentId || isNaN(momentId)) {
    return res.status(400).json({ error: '动态ID无效' });
  }
  
  // 查询评论，支持嵌套回复
  const query = `
    SELECT 
      c.id,
      c.moment_id,
      c.user_id,
      c.content,
      c.reply_to_id,
      c.created_at,
      u.username,
      u.role,
      reply_to_user.username as reply_to_username
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN comments reply_to_comment ON c.reply_to_id = reply_to_comment.id
    LEFT JOIN users reply_to_user ON reply_to_comment.user_id = reply_to_user.id
    WHERE c.moment_id = ?
    ORDER BY c.created_at ASC
  `;
  
  db.all(query, [momentId], (err, comments) => {
    if (err) {
      console.error('❗ 获取评论失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    console.log(`✅ 成功获取 ${comments.length} 条评论`);
    res.json({ comments });
  });
});

// 发布评论
router.post('/:momentId/comments', (req, res) => {
  const { momentId } = req.params;
  const { user_id, content, reply_to_id } = req.body;
  
  console.log(`💬 用户 ${user_id} 为动态 ${momentId} 发布评论`);
  
  // 验证必填字段
  if (!user_id || !content || !momentId) {
    console.log('❌ 验证失败: 缺少必填字段');
    return res.status(400).json({ error: '用户ID、评论内容和动态ID不能为空' });
  }
  
  if (isNaN(momentId)) {
    return res.status(400).json({ error: '动态ID无效' });
  }
  
  // 验证用户是否存在
  db.get('SELECT id, username FROM users WHERE id = ?', [user_id], (err, user) => {
    if (err) {
      console.error('❗ 验证用户失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      console.log('❌ 用户不存在:', user_id);
      return res.status(400).json({ error: '用户不存在' });
    }
    
    // 验证动态是否存在
    db.get('SELECT id FROM moments WHERE id = ?', [momentId], (err, moment) => {
      if (err) {
        console.error('❗ 验证动态失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!moment) {
        console.log('❌ 动态不存在:', momentId);
        return res.status(400).json({ error: '动态不存在' });
      }
      
      // 如果有回复目标，验证回复的评论是否存在
      if (reply_to_id) {
        db.get('SELECT id FROM comments WHERE id = ? AND moment_id = ?', [reply_to_id, momentId], (err, replyComment) => {
          if (err) {
            console.error('❗ 验证回复评论失败:', err);
            return res.status(500).json({ error: '数据库错误' });
          }
          
          if (!replyComment) {
            console.log('❌ 回复的评论不存在:', reply_to_id);
            return res.status(400).json({ error: '回复的评论不存在' });
          }
          
          // 执行插入评论
          insertComment();
        });
      } else {
        // 直接插入评论
        insertComment();
      }
      
      function insertComment() {
        const createdAt = new Date().toISOString();
        
        db.run(
          'INSERT INTO comments (moment_id, user_id, content, reply_to_id, created_at) VALUES (?, ?, ?, ?, ?)',
          [momentId, user_id, content, reply_to_id || null, createdAt],
          function (err) {
            if (err) {
              console.error('❗ 发布评论失败:', err);
              return res.status(500).json({ error: '数据库错误' });
            }
            
            console.log('✅ 评论发布成功, ID:', this.lastID);
            
            // 返回新创建的评论信息
            const newComment = {
              id: this.lastID,
              moment_id: parseInt(momentId),
              user_id: parseInt(user_id),
              content,
              reply_to_id: reply_to_id || null,
              created_at: createdAt,
              username: user.username
            };
            
            res.json({ 
              message: '评论发布成功', 
              commentId: this.lastID,
              comment: newComment
            });
          }
        );
      }
    });
  });
});

// 删除评论
router.delete('/comments/:commentId', (req, res) => {
  const { commentId } = req.params;
  const { user_id } = req.body;
  
  console.log(`🗑️ 用户 ${user_id} 删除评论 ${commentId}`);
  
  if (!user_id) {
    return res.status(400).json({ error: '用户ID不能为空' });
  }
  
  if (!commentId || isNaN(commentId)) {
    return res.status(400).json({ error: '评论ID无效' });
  }
  
  // 验证是否是评论的发布者或管理员
  db.get(
    `SELECT c.user_id, u.role 
     FROM comments c 
     JOIN users u ON c.user_id = u.id 
     WHERE c.id = ?`, 
    [commentId],
    (err, comment) => {
      if (err) {
        console.error('❗ 查询评论失败:', err);
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!comment) {
        return res.status(404).json({ error: '评论不存在' });
      }
      
      // 获取当前用户信息
      db.get('SELECT role FROM users WHERE id = ?', [user_id], (err, currentUser) => {
        if (err) {
          console.error('❗ 查询用户失败:', err);
          return res.status(500).json({ error: '数据库错误' });
        }
        
        // 只有评论作者或管理员可以删除评论
        if (comment.user_id !== parseInt(user_id) && currentUser?.role !== 'admin') {
          return res.status(403).json({ error: '无权限删除此评论' });
        }
        
        db.run('DELETE FROM comments WHERE id = ?', [commentId], function (err) {
          if (err) {
            console.error('❗ 删除评论失败:', err);
            return res.status(500).json({ error: '数据库错误' });
          }
          
          console.log('✅ 评论删除成功, ID:', commentId);
          res.json({ message: '删除成功' });
        });
      });
    }
  );
});

// 获取动态列表时包含评论数量
router.get('/with-comments', (req, res) => {
  console.log('📖 获取动态列表（包含评论数）');
  
  const query = `
    SELECT 
      moments.*, 
      users.username, 
      users.role,
      COUNT(comments.id) as comment_count
    FROM moments 
    JOIN users ON moments.user_id = users.id 
    LEFT JOIN comments ON moments.id = comments.moment_id
    GROUP BY moments.id
    ORDER BY 
      CASE WHEN users.role = 'admin' THEN 0 ELSE 1 END,
      moments.created_at DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('❗ 获取动态失败:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    console.log(`✅ 成功获取 ${rows.length} 条动态（含评论数）`);
    res.json({ moments: rows });
  });
});

module.exports = router;