// routes/auth.js
const express = require('express');
const db = require('../database');
const router = express.Router();

// 注册接口
router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名或密码不能为空' });
  }

  db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, password],
    function (err) {
      if (err) {
        console.error('❗ 注册失败：', err);  // ✅ 控制台输出错误详情
        return res.status(500).json({ error: '服务器错误，请稍后重试' });
      }
      res.json({ message: '注册成功', userId: this.lastID });
    }
  );
});


// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) return res.status(500).json({ error: '数据库错误' });
      if (!user) return res.status(401).json({ error: '用户名或密码错误' });
      res.json({ message: '登录成功', userId: user.id });
    }
  );
});

module.exports = router;
