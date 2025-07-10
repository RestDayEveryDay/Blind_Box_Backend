const express = require('express');
const cors = require('cors');
const boxRoutes = require('./routes/box');
const poolRoutes = require('./routes/pool');
const authRoutes = require('./routes/auth'); // ✅ 引入 auth 路由

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 注册 API 路由
app.use('/api/auth', authRoutes);           // 注册、登录
app.use('/api/boxes', boxRoutes);           // 抽盲盒相关
app.use('/api/pools', poolRoutes);          // 盲盒池

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
