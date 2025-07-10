const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../blindbox.db');
console.log(`\n📁 正在写入数据库： ${dbPath}`);

// 如果数据库已存在，先删除
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
  } catch (err) {
    console.error('❌ 无法删除旧数据库，可能被其他程序占用');
    process.exit(1);
  }
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('CREATE TABLE box_pools (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, imageUrl TEXT)');
  db.run(`CREATE TABLE boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    probability REAL,
    pool_id INTEGER,
    FOREIGN KEY(pool_id) REFERENCES box_pools(id)
  )`);

  const pools = [
    { name: '龙猫系列', imageUrl: 'https://picsum.photos/200/100?random=1' },
    { name: '甜点系列', imageUrl: 'https://picsum.photos/200/100?random=2' },
    { name: '机械战士', imageUrl: 'https://picsum.photos/200/100?random=3' },
    { name: '森林动物', imageUrl: 'https://picsum.photos/200/100?random=4' },
  ];

  const boxesByPool = {
    '龙猫系列': [
      ['龙猫草帽', '戴草帽的龙猫', 0.5],
      ['龙猫公交站', '雨中的龙猫', 0.3],
      ['龙猫隐藏款', '极其稀有', 0.2]
    ],
    '甜点系列': [
      ['蛋糕熊', '像蛋糕一样的熊', 0.6],
      ['草莓猫', '草莓味猫咪', 0.4]
    ],
    '机械战士': [
      ['银色机甲', '闪亮机甲战士', 0.7],
      ['黑曜核心', '强力隐藏款', 0.3]
    ],
    '森林动物': [
      ['橡果狸猫', '藏在森林的狸猫', 0.8],
      ['夜行猫头鹰', '悄悄出现的稀有角色', 0.2]
    ]
  };

  let insertedCount = 0;
  pools.forEach(pool => {
    db.run('INSERT INTO box_pools (name, imageUrl) VALUES (?, ?)', [pool.name, pool.imageUrl], function (err) {
      if (err) return console.error('插入池失败：', err);

      const poolId = this.lastID;
      const boxes = boxesByPool[pool.name];

      boxes.forEach(([name, desc, prob], idx, arr) => {
        db.run('INSERT INTO boxes (name, description, probability, pool_id) VALUES (?, ?, ?, ?)',
          [name, desc, prob, poolId],
          () => {
            // 所有池子插入完所有盲盒后才关闭
            insertedCount++;
            if (insertedCount === Object.values(boxesByPool).flat().length) {
              db.close();
              console.log('✅ 数据库初始化完成，包含多个盲盒池与盲盒');
            }
          }
        );
      });
    });
  });
});
