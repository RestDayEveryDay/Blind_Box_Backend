const express = require('express');
const cors = require('cors');

console.log('🔍 开始详细调试...');

const app = express();

// 基本中间件
app.use(cors());
app.use(express.json());

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

console.log('✅ 基本路由设置完成');

// 逐个加载路由并测试
const routes = [
  { name: 'auth', path: './routes/auth', mount: '/api/auth' },
  { name: 'box', path: './routes/box', mount: '/api/boxes' },
  { name: 'pool', path: './routes/pool', mount: '/api/pools' },
  { name: 'admin', path: './routes/admin', mount: '/api/admin' },
  { name: 'moments', path: './routes/moments', mount: '/api/moments' }
];

for (const route of routes) {
  try {
    console.log(`\n📁 开始加载 ${route.name} 路由...`);
    
    // 加载路由模块
    const routeModule = require(route.path);
    console.log(`✅ ${route.name} 模块加载成功`);
    
    // 检查路由模块的结构
    if (routeModule && routeModule.stack) {
      console.log(`📋 ${route.name} 路由包含 ${routeModule.stack.length} 个路由处理器`);
      
      // 检查每个路由定义
      routeModule.stack.forEach((layer, index) => {
        try {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ');
            const path = layer.route.path;
            console.log(`  ${index + 1}. ${methods.toUpperCase()} ${path}`);
            
            // 检查路径是否包含问题字符
            if (path.includes('://') || path.includes('git.new')) {
              console.error(`❌ 发现问题路径: ${path}`);
            }
          } else if (layer.name === 'router') {
            console.log(`  ${index + 1}. 嵌套路由器`);
          } else {
            console.log(`  ${index + 1}. 中间件: ${layer.name || '匿名'}`);
          }
        } catch (layerErr) {
          console.error(`❌ 检查路由层时出错:`, layerErr.message);
        }
      });
    }
    
    // 尝试挂载路由
    console.log(`🔗 尝试挂载 ${route.name} 到 ${route.mount}...`);
    app.use(route.mount, routeModule);
    console.log(`✅ ${route.name} 路由挂载成功`);
    
    // 测试服务器启动（这里可能会出错）
    console.log(`🧪 测试服务器状态...`);
    
  } catch (err) {
    console.error(`💥 ${route.name} 路由处理失败:`, err.message);
    console.error('详细错误:', err.stack);
    
    // 如果是 path-to-regexp 错误，说明找到问题了
    if (err.message.includes('Missing parameter name')) {
      console.error(`🎯 找到问题路由: ${route.name}`);
      console.error('这个路由文件中可能有格式错误的路径定义');
      break;
    }
  }
}

// 尝试启动服务器
console.log('\n🚀 尝试启动服务器...');
try {
  const server = app.listen(3002, () => {
    console.log('✅ 服务器启动成功！');
    console.log('📋 最终注册的路由:');
    
    app._router.stack.forEach((middleware, index) => {
      if (middleware.route) {
        console.log(`${index + 1}. ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
      } else if (middleware.name === 'router') {
        console.log(`${index + 1}. Router: ${middleware.regexp.source}`);
      } else {
        console.log(`${index + 1}. Middleware: ${middleware.name || '匿名'}`);
      }
    });
    
    server.close();
    console.log('\n✅ 调试完成');
    process.exit(0);
  });
} catch (err) {
  console.error('💥 服务器启动失败:', err.message);
  console.error('详细错误:', err.stack);
  process.exit(1);
}