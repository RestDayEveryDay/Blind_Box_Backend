const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 基础中间件
app.use(cors());
app.use(express.json());

// 静态文件服务 - 提供图片访问
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器正常' });
});

// 手动添加每个路由
console.log('加载路由...');

// Auth 路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
console.log('Auth OK');

// Box 路由  
const boxRoutes = require('./routes/box');
app.use('/api/boxes', boxRoutes);
console.log('Box OK');

// Pool 路由
const poolRoutes = require('./routes/pool');
app.use('/api/pools', poolRoutes);
console.log('Pool OK');

// Pool Draw 路由 - 新增
try {
  const poolDrawRoutes = require('./routes/pool-draw');
  app.use('/api/pools', poolDrawRoutes);
  console.log('Pool Draw OK');
} catch (err) {
  console.warn('Pool Draw 路由加载失败:', err.message);
}

// Admin 路由
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
console.log('Admin OK');

// Moments 路由
const momentRoutes = require('./routes/moments');
app.use('/api/moments', momentRoutes);
console.log('Moments OK');

// Orders 路由
try {
  const orderRoutes = require('./routes/orders');
  app.use('/api/orders', orderRoutes);
  console.log('Orders OK');
} catch (err) {
  console.warn('Orders 路由加载失败:', err.message);
}

// Rankings 路由
try {
  const rankingRoutes = require('./routes/rankings');
  app.use('/api/rankings', rankingRoutes);
  console.log('Rankings OK');
} catch (err) {
  console.warn('Rankings 路由加载失败:', err.message);
}

console.log('所有路由加载完成，启动服务器...');

// 启动服务器
app.listen(3001, () => {
  console.log('服务器运行在 http://localhost:3001');
  console.log('📁 图片服务: http://localhost:3001/images/');
  console.log('可用的API端点:');
  console.log('  - GET  /api/health');
  console.log('  - POST /api/auth/register');
  console.log('  - POST /api/auth/login');
  console.log('  - POST /api/boxes/draw');
  console.log('  - GET  /api/pools');
  console.log('  - GET  /api/moments');
  console.log('  - POST /api/moments');
  console.log('  - GET  /api/orders/user/:userId');
  console.log('  - GET  /api/orders/stats/:userId');
  console.log('  - GET  /api/rankings/luck');
});

module.exports = app;