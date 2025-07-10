const express = require('express');
const db = require('../database'); // SQLite 连接
const router = express.Router();

// 按池子抽盲盒
router.post('/draw', (req, res) => {
  const poolId = req.body.poolId;

  if (!poolId) {
    return res.status(400).json({ error: 'poolId 是必须的' });
  }

  db.all('SELECT * FROM boxes WHERE pool_id = ?', [poolId], (err, boxes) => {
    if (err) return res.status(500).json({ error: err.message });
    if (boxes.length === 0) return res.status(404).json({ error: '该系列暂无盲盒' });

    const totalWeight = boxes.reduce((sum, box) => sum + box.probability, 0);
    const rand = Math.random() * totalWeight;

    let acc = 0;
    const selected = boxes.find(box => {
      acc += box.probability;
      return rand <= acc;
    });

    res.json({ box: selected });
  });
});

module.exports = router;
