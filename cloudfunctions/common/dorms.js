// 武生院宿舍数据（云函数共享，与 utils/campusData.js 保持同步）

const ALL_DORMS = [
  '新柏居', '松柏居', '新松居', '东四舍', '东五舍', '翠微居南楼', '翠微居北楼', '东八舍',
  '中园公寓', '中南公寓', '三友园', '四季园', '清水居', '鄱阳居', '苏园居', '钱塘居',
  '黄浦居', '潇湘居', '江汉居', '知行1栋', '知行2栋', '知行3栋', '知行4栋', '知行5栋', '知行6栋',
  '敏学1栋', '敏学2栋', '敏学3栋', '敏学4栋', '敏学5栋',
  '洪山园1栋', '洪山园2栋', '洪山园4栋',
  '滨水居', '巴山居', '青枫居', '新梧居', '文园', '静园', '竹园', '兰园', '菊园'
];

const MAIN_DORMS = [
  '中园公寓', '中南公寓', '新柏居', '苏园居', '知行1栋', '敏学1栋',
  '松柏居', '三友园', '四季园', '清水居', '新松居', '洪山园1栋'
];

function getLevel(count, maxCount) {
  if (!count || !maxCount) {
    return 'cold';
  }
  const ratio = count / maxCount;
  if (ratio >= 0.75) {
    return 'hot';
  }
  if (ratio >= 0.5) {
    return 'warm';
  }
  if (ratio >= 0.25) {
    return 'normal';
  }
  return 'cold';
}

function getDemoDormHeat() {
  const raw = [
    { dorm: '中园公寓', count: 86 },
    { dorm: '苏园居', count: 72 },
    { dorm: '中南公寓', count: 65 },
    { dorm: '知行1栋', count: 58 },
    { dorm: '新柏居', count: 51 },
    { dorm: '三友园', count: 47 },
    { dorm: '敏学1栋', count: 43 },
    { dorm: '松柏居', count: 38 }
  ];
  const maxCount = raw[0].count;
  return raw.map((item) => ({
    ...item,
    level: getLevel(item.count, maxCount),
    percent: Math.round((item.count / maxCount) * 100)
  }));
}

function getDemoHotBoxes() {
  const pairs = [
    ['中园公寓', '苏园居'],
    ['中南公寓', '知行1栋'],
    ['新柏居', '敏学1栋'],
    ['三友园', '松柏居'],
    ['清水居', '四季园'],
    ['苏园居', '洪山园1栋']
  ];
  const titles = ['神秘文具盲盒', '零食大礼包', '美妆盲盒', '科技小玩意儿', '图书盲盒', '运动器材盲盒'];
  const prices = [9.9, 19.9, 29.9, 39.9, 14.9, 24.9];
  const sales = [23, 45, 18, 12, 27, 15];

  return pairs.map(([from, to], i) => ({
    _id: String(i + 1),
    title: titles[i],
    price: prices[i],
    images: [`data:image/svg+xml,%253Csvg%2520xmlns%253D%2522http%253A%252F%252Fwww.w3.org%252F2000%252Fsvg%2522%2520width%253D%2522400%2522%2520height%253D%2522400%2522%253E%253Crect%2520width%253D%2522400%2522%2520height%253D%2522400%2522%2520fill%253D%2522%2523f3e8ff%2522%252F%253E%253Ctext%2520x%253D%2522200%2522%2520y%253D%2522220%2522%2520text-anchor%253D%2522middle%2522%2520font-size%253D%252260%2522%2520fill%253D%2522%2523c8a2ff%2522%253E%25E2%259C%25A8%253C%252Ftext%253E%253C%252Fsvg%253E`],
    from_dorm: from,
    to_dorm: to,
    stock: 30,
    sales: sales[i]
  }));
}

function getDemoOrders() {
  const now = Date.now();
  return [
    {
      _id: 'demo_order_1',
      box_title: '惊喜文具盲盒',
      price: 19.9,
      delivery_fee: 5,
      from_dorm: '中园公寓',
      to_dorm: '苏园居',
      status: 'pending',
      create_time: now - 1800000,
      distance: 0.8
    },
    {
      _id: 'demo_order_2',
      box_title: '时尚饰品盲盒',
      price: 29.9,
      delivery_fee: 6,
      from_dorm: '中南公寓',
      to_dorm: '知行1栋',
      status: 'pending',
      create_time: now - 3600000,
      distance: 1.2
    },
    {
      _id: 'demo_order_3',
      box_title: '数码配件盲盒',
      price: 39.9,
      delivery_fee: 8,
      from_dorm: '新柏居',
      to_dorm: '敏学1栋',
      status: 'pending',
      create_time: now - 5400000,
      distance: 0.6
    }
  ];
}

module.exports = {
  ALL_DORMS,
  MAIN_DORMS,
  getDemoDormHeat,
  getDemoHotBoxes,
  getDemoOrders,
  getLevel
};
