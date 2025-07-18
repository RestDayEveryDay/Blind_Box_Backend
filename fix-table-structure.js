// fix-table-structure.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\fix-table-structure.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'blindbox.db');
console.log('📁 数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

console.log('🔧 开始修复表结构...\n');

db.serialize(() => {
  console.log('1️⃣ 检查当前表结构...');
  
  // 检查 box_pools 表结构
  db.all("PRAGMA table_info(box_pools)", (err, columns) => {
    if (err) {
      console.error('❌ 获取表结构失败:', err);
      return;
    }

    console.log('📋 当前 box_pools 表结构:');
    const columnNames = [];
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
      columnNames.push(col.name);
    });

    // 检查缺少的列
    const requiredColumns = ['description', 'image_url'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    console.log(`\n📊 缺失的列: ${missingColumns.length > 0 ? missingColumns.join(', ') : '无'}`);
    
    if (missingColumns.length > 0) {
      addMissingColumns(missingColumns);
    } else {
      console.log('✅ box_pools 表结构完整');
      checkItemsTable();
    }
  });
  
  function addMissingColumns(missingColumns) {
    console.log('\n2️⃣ 添加缺失的列...');
    
    let columnsAdded = 0;
    
    missingColumns.forEach(columnName => {
      let sql;
      if (columnName === 'description') {
        sql = 'ALTER TABLE box_pools ADD COLUMN description TEXT';
      } else if (columnName === 'image_url') {
        sql = 'ALTER TABLE box_pools ADD COLUMN image_url TEXT';
      }
      
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ 添加列 ${columnName} 失败:`, err.message);
        } else {
          console.log(`✅ 添加列: ${columnName}`);
        }
        
        columnsAdded++;
        if (columnsAdded === missingColumns.length) {
          checkItemsTable();
        }
      });
    });
  }
  
  function checkItemsTable() {
    console.log('\n3️⃣ 检查 items 表结构...');
    
    db.all("PRAGMA table_info(items)", (err, columns) => {
      if (err) {
        console.error('❌ 获取 items 表结构失败:', err);
        finishFix();
        return;
      }

      console.log('📋 当前 items 表结构:');
      const columnNames = [];
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
        columnNames.push(col.name);
      });

      // 检查 items 表的必要列
      const requiredItemColumns = ['pool_id', 'name', 'description', 'image_url', 'rarity', 'drop_rate'];
      const missingItemColumns = requiredItemColumns.filter(col => !columnNames.includes(col));
      
      console.log(`\n📊 items 表缺失的列: ${missingItemColumns.length > 0 ? missingItemColumns.join(', ') : '无'}`);
      
      if (missingItemColumns.length > 0) {
        addMissingItemColumns(missingItemColumns);
      } else {
        console.log('✅ items 表结构完整');
        finishFix();
      }
    });
  }
  
  function addMissingItemColumns(missingColumns) {
    console.log('\n4️⃣ 修复 items 表结构...');
    
    let columnsAdded = 0;
    
    missingColumns.forEach(columnName => {
      let sql;
      switch(columnName) {
        case 'pool_id':
          sql = 'ALTER TABLE items ADD COLUMN pool_id INTEGER NOT NULL DEFAULT 1';
          break;
        case 'description':
          sql = 'ALTER TABLE items ADD COLUMN description TEXT';
          break;
        case 'image_url':
          sql = 'ALTER TABLE items ADD COLUMN image_url TEXT';
          break;
        case 'rarity':
          sql = 'ALTER TABLE items ADD COLUMN rarity TEXT CHECK(rarity IN (\'normal\', \'hidden\')) DEFAULT \'normal\'';
          break;
        case 'drop_rate':
          sql = 'ALTER TABLE items ADD COLUMN drop_rate REAL DEFAULT 0.10';
          break;
        default:
          sql = `ALTER TABLE items ADD COLUMN ${columnName} TEXT`;
      }
      
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ 添加列 ${columnName} 失败:`, err.message);
        } else {
          console.log(`✅ 添加列: ${columnName}`);
        }
        
        columnsAdded++;
        if (columnsAdded === missingColumns.length) {
          finishFix();
        }
      });
    });
  }
  
  function finishFix() {
    console.log('\n5️⃣ 验证修复结果...');
    
    // 最终验证
    db.all("PRAGMA table_info(box_pools)", (err, poolColumns) => {
      if (err) {
        console.error('❌ 验证失败:', err);
      } else {
        console.log('\n📋 修复后的 box_pools 表结构:');
        poolColumns.forEach(col => {
          console.log(`  ✅ ${col.name}: ${col.type}`);
        });
      }
      
      db.all("PRAGMA table_info(items)", (err, itemColumns) => {
        if (err) {
          console.error('❌ 验证失败:', err);
        } else {
          console.log('\n📋 修复后的 items 表结构:');
          itemColumns.forEach(col => {
            console.log(`  ✅ ${col.name}: ${col.type}`);
          });
        }
        
        db.close((err) => {
          if (err) {
            console.error('❌ 关闭数据库失败:', err.message);
          } else {
            console.log('\n🎉 表结构修复完成！');
            console.log('\n📋 接下来的步骤:');
            console.log('  1. 重新运行: node custom-blindbox-creator.js');
            console.log('  2. 检查数据是否正确创建');
            console.log('  3. 重启服务器: node clean-app.js');
          }
        });
      });
    });
  }
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭数据库连接...');
  db.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库失败:', err.message);
    } else {
      console.log('✅ 数据库连接已关闭');
    }
    process.exit(0);
  });
});