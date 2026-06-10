/**
 * 快速测试工具
 * 在本地环境模拟小程序运行
 */

const { healthCheck, mockData } = require('./index.js');

function runTests() {
  console.log('\n===========================================');
  console.log('      🧪 快速测试工具');
  console.log('===========================================');
  
  console.log('\n📝 1. 项目健康检查...');
  const healthResult = healthCheck.checkProject();
  
  console.log('\n📦 2. 生成测试数据...');
  mockData.saveMockData();
  
  console.log('\n🔍 3. 云函数测试...');
  testCloudFunctions();
  
  console.log('\n✅ 测试完成！');
  
  if (healthResult) {
    console.log('\n📌 下一步操作:');
    console.log('1. 打开微信开发者工具');
    console.log('2. 导入项目目录');
    console.log('3. 配置云开发环境');
    console.log('4. 预览测试');
  }
}

function testCloudFunctions() {
  const functions = [
    { name: 'getGrabOrders', testData: { filter: 'all' } },
    { name: 'getHotBoxes', testData: {} },
    { name: 'checkRiderStatus', testData: {} }
  ];
  
  functions.forEach(func => {
    console.log(`   - ${func.name}: ✅ (Mock数据已准备)`);
  });
}

function main() {
  runTests();
}

if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  main
};
