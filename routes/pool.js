const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const sql = `
    SELECT 
      box_pools.id AS poolId,
      box_pools.name AS poolName,
      box_pools.imageUrl,
      boxes.id AS boxId,
      boxes.name AS boxName,
      boxes.description
    FROM box_pools
    LEFT JOIN boxes ON boxes.pool_id = box_pools.id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // 分组结构
    const pools = {};
    rows.forEach(row => {
      const poolId = row.poolId;
      if (!pools[poolId]) {
        pools[poolId] = {
          id: poolId,
          name: row.poolName,
          imageUrl: row.imageUrl,
          boxes: []
        };
      }

      if (row.boxId) {
        pools[poolId].boxes.push({
          id: row.boxId,
          name: row.boxName,
          description: row.description
        });
      }
    });

    res.json({ pools: Object.values(pools) });
  });
});

module.exports = router;
