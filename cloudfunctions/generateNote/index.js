const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  try {
    const { title } = event;
    
    const templates = [
      `这个${title}承载着我的美好回忆，希望它能带给你同样的快乐。生活就像盲盒，充满惊喜和期待。`,
      `每一个物品都有它的故事，这个${title}曾陪伴我度过一段美好的时光，现在它将开始新的旅程。`,
      `在校园的日子里，这个${title}给我带来了很多便利和乐趣，希望它也能为你增添一份温暖。`,
      `精心挑选的${title}，希望它能成为你生活中的小确幸，让每一天都充满阳光。`,
      `这个${title}虽然不是全新的，但它承载着我的心意，希望你能喜欢它，让它继续发挥价值。`
    ];
    
    const randomIndex = Math.floor(Math.random() * templates.length);
    const note = templates[randomIndex];
    
    return {
      note
    };
  } catch (error) {
    console.error('生成寄语失败', error);
    return {
      note: '希望这个商品能给你带来快乐和温暖，让我们一起传递爱心。'
    };
  }
};