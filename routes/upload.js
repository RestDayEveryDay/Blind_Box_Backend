const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 确保上传目录存在
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('✅ 创建目录:', dirPath);
  }
};

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.params.type; // 'pools' 或 'items'
    const uploadPath = path.join(__dirname, '../public/images', type);
    
    // 确保目录存在
    ensureDirectoryExists(uploadPath);
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 原文件名
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const uniqueName = `${nameWithoutExt}_${timestamp}${ext}`;
    
    cb(null, uniqueName);
  }
});

// 文件过滤器 - 只允许图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
  }
};

// 配置 multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
  },
  fileFilter: fileFilter
});

// 图片上传路由
router.post('/:type', upload.single('image'), (req, res) => {
  const type = req.params.type;
  
  // 验证类型
  if (!['pools', 'items'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: '无效的上传类型，只支持 pools 或 items' 
    });
  }

  if (!req.file) {
    return res.status(400).json({ 
      success: false, 
      error: '没有上传文件' 
    });
  }

  // 生成访问URL - 使用相对路径，便于前端代理
  const imageUrl = `/images/${type}/${req.file.filename}`;
  
  console.log('📸 图片上传成功:', {
    type: type,
    filename: req.file.filename,
    size: req.file.size,
    url: imageUrl
  });

  res.json({
    success: true,
    message: '图片上传成功',
    data: {
      filename: req.file.filename,
      url: imageUrl,
      type: type,
      size: req.file.size
    }
  });
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小超出限制，最大允许 5MB'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    error: error.message || '上传失败'
  });
});

module.exports = router;