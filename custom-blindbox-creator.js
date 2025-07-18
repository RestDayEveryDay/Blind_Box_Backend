// custom-blindbox-creator.js
// 这个文件放在 C:\Users\12096\Desktop\blindbox-backend\custom-blindbox-creator.js
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

console.log('🎨 自定义盲盒创建器\n');

// ============== 在这里编写你的盲盒数据 ==============

const customBlindboxData = [
  // 第一个系列：忙碌的芙芙官
  {
    pool: {
      name: '忙碌的芙芙官',
      description: '可怜牛马年纪轻轻背上八十年房贷，十分不建议领会芙芙官每天早八比鬼还重的怨气，除非带着加班费',
      image_url: 'http://localhost:3001/images/pools/fufu.jpg'
    },
    items: [
      // 普通款 1
      {
        name: '立正芙芙',
        description: '呼好险，早上打卡差点就要迟到了',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/lizhengfufu.jpg'
      },
      // 普通款 2
      {
        name: '查账芙芙',
        description: '嗯，今天的账目很齐整，一下就算完了呢，下班下班',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/chazhangfufu.jpg'
      },
      // 普通款 3
      {
        name: '开会芙芙',
        description: '坐在会议室里装认真的芙芙官，其实在想午饭吃什么',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/kaihuifufu.jpg'
      },
      // 普通款 4
      {
        name: '记账芙芙',
        description: '今天买了胭脂，前天买了糯米和竹筒，这些都要报销，记下来记下来',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/jizhangfufu.jpg'
      },
      // 普通款 5
      {
        name: '开心芙芙',
        description: '想到什么好事了呢？开心得冒泡泡啦',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/kaixinfufu.jpg'
      },
      // 普通款 6
      {
        name: '黑线芙芙',
        description: '二牛说下次再冲动行事，就不仅仅是记仇这么简单了',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/heixianfufu.jpg'
      },
      // 普通款 7
      {
        name: '生气芙芙',
        description: '不要摸鱼！不要把鱼放在地上！！不要穿着沾满泥巴的鞋子进前厅！！！',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/shengqifufu.jpg'
      },
      // 普通款 8
      {
        name: '发呆芙芙',
        description: '对着账本走神的芙芙官，灵魂已经飞到九霄云外，比如，晚上你要不要去夜市？',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/fadaifufu.jpg'
      },
      // 普通款 9
      {
        name: '午睡芙芙',
        description: '好困好困，工作什么的，下午再说吧（哈欠）',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/wushuifufu.jpg'
      },
      // 隐藏款
      {
        name: '巫子芙芙',
        description: '记忆里有一个梦一般的晚上，芙芙被装扮成巫子的样子，仅此一夜哦',
        rarity: 'hidden',
        image_url: 'http://localhost:3001/images/items/wuzifufu.jpg'
      }
    ]
  },

  // 第二个系列
  {
    pool: {
      name: '端庄的长公子',
      description: '长公子最喜欢的食物当然是甜点啦，什么？控制饮食？喂，消停点吧，长公子在敲他的骨瓷杯咯',
      image_url: 'http://localhost:3001/images/pools/xiaoyuan.jpg'
    },
    items: [
      //normal 1
      {
        name: '委屈小袁',
        description: '快哄哄吧，再不哄，有个人就要掉小珍珠了',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/weiquxiaoyuan.jpg'
      },
      //normal 2
      {
        name: '举信小袁',
        description: '殿下，最近可还安康？在下近日得了些好茶，随书信奉上。',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/juxinxiaoyuan.jpg'
      },
      //normal 3
      {
        name: '摇铃小袁',
        description: '叮铃铃叮铃铃，在下已经摇了十秒钟了，殿下怎么还未接电话...莫不是已厌倦了在下...',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/yaolingxiaoyuan.jpg'
      },
      //normal 4
      {
        name: '开心小袁',
        description: '是吃到特别好吃的点心了？还是因为别的呢？',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/kaixinxiaoyuan.jpg'
      },
      //normal 5
      {
        name: '震惊小袁',
        description: '？！！！殿下...殿下......不要再拿在下消遣了...',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/zhenjingxiaoyuan.jpg'
      },
      //normal 6
      {
        name: '思考小袁',
        description: '今日要见殿下，又要想个什么由头呢？狸奴会后空翻已经用过了，唔...',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/sikaoxiaoyuan.jpg'
      },
      
      //normal 7
      {
        name: '气球小袁',
        description: '传言说一向不苟言笑的长公子有一天半夜回房时蹦蹦跳跳的，还拿着一只不知道从哪里来的气球，啧啧啧',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/qiqiuxiaoyuan.jpg'
      },
      //normal 8
      {
        name: '拆礼物小袁',
        description: '殿下有心了，殿下送什么，袁基都喜欢',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/chailiwuxiaoyuan.jpg'
      },
      //normal 9
      {
        name: '偃甲小袁',
        description: '长公子小时候痴迷这种偃甲做的鸟儿，常常痴痴望向窗外，似乎在期待有什么会突然出现',
        rarity: 'normal',
        image_url: 'http://localhost:3001/images/items/yanjiaxiaoyuan.jpg'
      },
      //special
      {
        name: '冬裘小袁',
        description: '那一个寒冷刺骨的冬天，他穿着冬裘留守孤城，烧掉了一切可以烧的东西',
        rarity: 'hidden',
        image_url: 'http://localhost:3001/images/items/dongqiuxiaoyuan.jpg'
      },  
      // ... 继续添加其他8个普通款和1个隐藏款
      // 为了节省空间，我先只写一个示例，你可以补充完整
    ]
  }

  // 你可以继续添加第三、四、五个系列...
];

// ============== 数据配置完成，以下是处理逻辑 ==============

// 自动计算概率的函数
const calculateDropRates = (items) => {
  const normalItems = items.filter(item => item.rarity === 'normal');
  const hiddenItems = items.filter(item => item.rarity === 'hidden');
  
  const hiddenRate = 0.05; // 隐藏款固定5%
  const normalTotalRate = 0.95; // 普通款总共95%
  const normalItemRate = normalTotalRate / normalItems.length; // 每个普通款的概率
  
  // 为每个物品设置概率
  items.forEach(item => {
    if (item.rarity === 'normal') {
      item.drop_rate = normalItemRate;
    } else if (item.rarity === 'hidden') {
      item.drop_rate = hiddenRate / hiddenItems.length; // 如果有多个隐藏款就平分
    }
  });
  
  return items;
};

// 验证数据完整性
const validateData = () => {
  console.log('🔍 验证数据完整性...\n');
  
  let hasError = false;
  
  customBlindboxData.forEach((series, seriesIndex) => {
    console.log(`📦 系列 ${seriesIndex + 1}: ${series.pool.name}`);
    
    if (!series.pool.name || !series.pool.description) {
      console.log('❌ 盲盒池信息不完整');
      hasError = true;
    }
    
    if (!series.items || series.items.length !== 10) {
      console.log(`❌ 物品数量错误，应该是10个，实际是${series.items ? series.items.length : 0}个`);
      hasError = true;
    } else {
      const normalCount = series.items.filter(item => item.rarity === 'normal').length;
      const hiddenCount = series.items.filter(item => item.rarity === 'hidden').length;
      
      console.log(`   - 普通款: ${normalCount} 个`);
      console.log(`   - 隐藏款: ${hiddenCount} 个`);
      
      if (normalCount !== 9 || hiddenCount !== 1) {
        console.log('❌ 稀有度分配错误，应该是9个普通款+1个隐藏款');
        hasError = true;
      }
      
      // 检查每个物品是否有完整信息
      series.items.forEach((item, itemIndex) => {
        if (!item.name || !item.description) {
          console.log(`❌ 物品 ${itemIndex + 1} 信息不完整`);
          hasError = true;
        }
      });
    }
    
    console.log('');
  });
  
  if (hasError) {
    console.log('❌ 数据验证失败，请检查并修正以上错误');
    return false;
  }
  
  console.log('✅ 数据验证通过！');
  return true;
};

// 执行数据库更新
const executeUpdate = () => {
  if (!validateData()) {
    db.close();
    return;
  }
  
  console.log('🚀 开始更新数据库...\n');
  
  db.serialize(() => {
    // 清除现有数据
    console.log('1️⃣ 清除现有数据...');
    db.run('DELETE FROM items', (err) => {
      if (err) {
        console.error('❌ 清除物品失败:', err);
        return;
      }
      console.log('✅ 已清除所有物品');
      
      db.run('DELETE FROM box_pools', (err) => {
        if (err) {
          console.error('❌ 清除盲盒池失败:', err);
          return;
        }
        console.log('✅ 已清除所有盲盒池');
        
        insertNewData();
      });
    });
  });
  
  function insertNewData() {
    console.log('\n2️⃣ 插入新数据...');
    
    let seriesProcessed = 0;
    
    customBlindboxData.forEach((series, seriesIndex) => {
      // 插入盲盒池
      db.run(
        'INSERT INTO box_pools (name, description, image_url) VALUES (?, ?, ?)',
        [series.pool.name, series.pool.description, series.pool.image_url],
        function(err) {
          if (err) {
            console.error(`❌ 创建盲盒池 "${series.pool.name}" 失败:`, err);
            return;
          }
          
          const poolId = this.lastID;
          console.log(`✅ 创建盲盒池: ${series.pool.name} (ID: ${poolId})`);
          
          // 计算并设置概率
          const itemsWithRates = calculateDropRates([...series.items]);
          
          // 插入物品
          let itemsInserted = 0;
          itemsWithRates.forEach((item, itemIndex) => {
            db.run(
              'INSERT INTO items (pool_id, name, description, image_url, rarity, drop_rate) VALUES (?, ?, ?, ?, ?, ?)',
              [poolId, item.name, item.description, item.image_url, item.rarity, item.drop_rate],
              function(err) {
                if (err) {
                  console.error(`❌ 创建物品 "${item.name}" 失败:`, err);
                } else {
                  console.log(`   ✅ ${item.name} (${item.rarity}, ${(item.drop_rate * 100).toFixed(1)}%)`);
                }
                
                itemsInserted++;
                if (itemsInserted === itemsWithRates.length) {
                  seriesProcessed++;
                  console.log(`📦 "${series.pool.name}" 完成 (${itemsWithRates.length} 个物品)\n`);
                  
                  if (seriesProcessed === customBlindboxData.length) {
                    finishUpdate();
                  }
                }
              }
            );
          });
        }
      );
    });
  }
  
  function finishUpdate() {
    console.log('3️⃣ 验证最终结果...');
    
    db.all(`
      SELECT 
        bp.name as pool_name,
        COUNT(i.id) as item_count,
        SUM(CASE WHEN i.rarity = 'normal' THEN 1 ELSE 0 END) as normal_count,
        SUM(CASE WHEN i.rarity = 'hidden' THEN 1 ELSE 0 END) as hidden_count,
        ROUND(SUM(i.drop_rate) * 100, 1) as total_probability
      FROM box_pools bp
      LEFT JOIN items i ON bp.id = i.pool_id
      GROUP BY bp.id, bp.name
      ORDER BY bp.id
    `, (err, summary) => {
      if (err) {
        console.error('❌ 验证失败:', err);
      } else {
        console.log('\n📊 最终验证结果:');
        summary.forEach(row => {
          const status = row.total_probability === 100 ? '✅' : '⚠️';
          console.log(`${status} ${row.pool_name}:`);
          console.log(`   物品总数: ${row.item_count} (普通:${row.normal_count}, 隐藏:${row.hidden_count})`);
          console.log(`   概率总和: ${row.total_probability}%`);
        });
      }
      
      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('\n🎉 自定义盲盒创建完成！');
          console.log('\n📋 接下来的步骤:');
          console.log('  1. 重启后端服务器: node clean-app.js');
          console.log('  2. 刷新前端页面查看新内容');
          console.log('  3. 开始测试抽取功能');
        }
      });
    });
  }
};

// 启动脚本
console.log('📝 提示：请在脚本顶部的 customBlindboxData 中编写你的盲盒数据');
console.log('📝 每个系列需要包含 9个普通款 + 1个隐藏款');
console.log('📝 确认数据完整后运行此脚本\n');

executeUpdate();

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