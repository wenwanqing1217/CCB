/**
 * love_data.js
 * 盲盒数据——由 data/mock-data.js 统一提供
 * 保持此文件作为兼容层，实际数据已在 mock-data.js 中定义
 */
const { boxes } = require('../../data/mock-data.js');
const blindBoxesData = boxes;
module.exports = { blindBoxesData };
