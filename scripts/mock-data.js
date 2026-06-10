/**
 * 数据模拟工具
 * 生成测试用的Mock数据
 */

const fs = require('fs');

const DORMS = ['中园公寓', '苏园居', '中南公寓', '知行1栋', '新柏居', '敏学1栋', '博雅居', '逸夫楼'];
const BOX_TITLES = [
  '惊喜文具盲盒', '时尚饰品盲盒', '数码配件盲盒', '美妆小样盲盒',
  '零食福袋盲盒', '动漫周边盲盒', '书籍盲盒', '运动装备盲盒'
];
const ITEM_NAMES = ['文具套装', '精美饰品', '手机配件', '化妆品小样', '进口零食', '动漫手办', '精选图书', '运动器材'];
const REMARKS = ['请尽快送达', '易碎物品小心', '贵重物品', '需要当面签收', '放在门口即可'];

function generateOrders(count = 10) {
  const orders = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const fromDorm = DORMS[Math.floor(Math.random() * DORMS.length)];
    let toDorm = DORMS[Math.floor(Math.random() * DORMS.length)];
    while (toDorm === fromDorm) {
      toDorm = DORMS[Math.floor(Math.random() * DORMS.length)];
    }
    
    orders.push({
      _id: `demo_order_${i + 1}`,
      box_title: BOX_TITLES[Math.floor(Math.random() * BOX_TITLES.length)],
      item_name: ITEM_NAMES[Math.floor(Math.random() * ITEM_NAMES.length)],
      price: (Math.random() * 50 + 10).toFixed(1),
      delivery_fee: Math.ceil(Math.random() * 10) + 3,
      from_dorm: fromDorm,
      to_dorm: toDorm,
      fromLatitude: 30.5928 + (Math.random() - 0.5) * 0.02,
      fromLongitude: 114.3055 + (Math.random() - 0.5) * 0.02,
      toLatitude: 30.5928 + (Math.random() - 0.5) * 0.02,
      toLongitude: 114.3055 + (Math.random() - 0.5) * 0.02,
      remark: REMARKS[Math.floor(Math.random() * REMARKS.length)],
      status: 'pending',
      create_time: now - Math.random() * 7200000,
      distance: (Math.random() * 1.5 + 0.3).toFixed(1),
      seller_openid: `seller_${i}`,
      seller_name: `用户${i + 1}`
    });
  }
  
  return orders;
}

function generateHotBoxes(count = 6) {
  const boxes = [];
  
  for (let i = 0; i < count; i++) {
    boxes.push({
      _id: `hot_box_${i + 1}`,
      title: BOX_TITLES[Math.floor(Math.random() * BOX_TITLES.length)],
      description: '超值惊喜，等你来开！',
      price: (Math.random() * 80 + 20).toFixed(1),
      original_price: (Math.random() * 50 + 30).toFixed(1),
      sales: Math.floor(Math.random() * 500) + 100,
      image: `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=blind%20box%20gift%20package%20${i}&image_size=square`,
      category: ['热门', '新品', '限时'][Math.floor(Math.random() * 3)],
      rating: (Math.random() * 1 + 4).toFixed(1),
      is_hot: Math.random() > 0.3
    });
  }
  
  return boxes;
}

function generateCommunityFeed(count = 8) {
  const feeds = [];
  const types = ['unbox', 'share', 'help'];
  
  for (let i = 0; i < count; i++) {
    feeds.push({
      _id: `feed_${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      user_id: `user_${i}`,
      user_name: `校园达人${i + 1}`,
      user_avatar: '',
      content: [
        '今天开到了超棒的盲盒！太开心了~',
        '分享一下我的开箱视频',
        '有没有小伙伴一起拼单？',
        '这个盲盒真的超值！强烈推荐',
        '第一次开盲盒，运气不错'
      ][Math.floor(Math.random() * 5)],
      images: Array(Math.floor(Math.random() * 3) + 1).fill('').map(() => 
        `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=blind%20box%20unboxing%20${i}&image_size=square`
      ),
      likes: Math.floor(Math.random() * 200),
      comments: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 30),
      created_at: Date.now() - Math.random() * 86400000
    });
  }
  
  return feeds;
}

function generateUserStats() {
  return {
    user_id: 'test_user',
    nickname: '测试用户',
    avatar: '',
    role: 'student',
    love_score: Math.floor(Math.random() * 500) + 100,
    blind_box_coins: Math.floor(Math.random() * 1000) + 100,
    dorm: DORMS[Math.floor(Math.random() * DORMS.length)],
    campus: '武汉大学',
    orders_completed: Math.floor(Math.random() * 50),
    rating: (Math.random() * 1 + 4).toFixed(1)
  };
}

function saveMockData() {
  console.log('📦 生成Mock数据...');
  
  const mockData = {
    orders: generateOrders(10),
    hotBoxes: generateHotBoxes(6),
    communityFeed: generateCommunityFeed(8),
    userStats: generateUserStats(),
    generatedAt: new Date().toISOString()
  };
  
  fs.writeFileSync('./mock-data.json', JSON.stringify(mockData, null, 2));
  console.log('✓ mock-data.json 已生成');
  
  return mockData;
}

function showDataStats(data) {
  console.log('\n📊 数据统计:');
  console.log('------------------------------');
  console.log(`订单数量: ${data.orders.length}`);
  console.log(`热门盲盒: ${data.hotBoxes.length}`);
  console.log(`社区动态: ${data.communityFeed.length}`);
  console.log(`用户数据: 1 条`);
}

function main() {
  console.log('\n===========================================');
  console.log('      🎲 Mock数据生成工具');
  console.log('===========================================');
  
  const data = saveMockData();
  showDataStats(data);
  
  console.log('\n✅ Mock数据生成完成！');
  console.log('数据已保存到: mock-data.json');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateOrders,
  generateHotBoxes,
  generateCommunityFeed,
  generateUserStats,
  saveMockData,
  main
};
