// 获取热门盲盒云函数（委托给boxService，带缓存）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 热门盲盒缓存（2分钟内不重复请求）
let hotBoxesCache = null;
let hotBoxesCacheTime = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2分钟

// 委托给boxService处理
exports.main = async (event, context) => {
  // 检查缓存
  if (hotBoxesCache && Date.now() - hotBoxesCacheTime < CACHE_TTL) {
    return hotBoxesCache;
  }
  
  const boxService = require('../boxService/index.js');
  const result = await boxService.main({ ...event, action: 'home' }, context);
  
  // 缓存结果
  hotBoxesCache = result;
  hotBoxesCacheTime = Date.now();
  
  return result;
};
