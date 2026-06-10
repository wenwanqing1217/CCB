/**
 * 脚本工具入口
 */

module.exports = {
  healthCheck: require('./health-check.js'),
  mockData: require('./mock-data.js'),
  quickTest: require('./quick-test.js'),
  initCloud: require('./init-cloud.js'),
  initDb: require('./init-db.js')
};
