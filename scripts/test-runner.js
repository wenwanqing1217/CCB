/**
 * 完整测试运行器
 * 验证项目核心功能是否正常工作
 */

const fs = require('fs');
const path = require('path');

async function runAllTests() {
  console.log('\n===========================================');
  console.log('      🧪 完整测试运行器');
  console.log('===========================================');
  
  const tests = [
    { name: '项目配置检查', test: testProjectConfig },
    { name: '页面路由检查', test: testPageRoutes },
    { name: '组件注册检查', test: testComponents },
    { name: '云函数配置检查', test: testCloudFunctions },
    { name: '工具函数检查', test: testUtils },
    { name: 'Mock数据验证', test: testMockData },
    { name: '代码质量检查', test: testCodeQuality }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    console.log(`\n📝 ${name}:`);
    console.log('------------------------------');
    
    try {
      const result = await test();
      if (result.passed > 0) {
        console.log(`✅ 通过: ${result.passed}/${result.total}`);
        passed += result.passed;
      }
      if (result.failed > 0) {
        console.log(`❌ 失败: ${result.failed}/${result.total}`);
        failed += result.failed;
      }
    } catch (error) {
      console.log(`❌ 测试异常: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n===========================================');
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
  
  const percentage = Math.round((passed / (passed + failed)) * 100);
  if (percentage >= 90) {
    console.log('🎉 项目状态优秀！');
  } else if (percentage >= 70) {
    console.log('👍 项目基本正常，建议修复部分问题');
  } else {
    console.log('⚠️ 项目存在较多问题，建议检查');
  }
  
  return { passed, failed, percentage };
}

function testProjectConfig() {
  const configs = [
    'project.config.json',
    'app.json', 
    'app.js',
    'package.json'
  ];
  
  let passed = 0;
  let failed = 0;
  
  configs.forEach(file => {
    if (fs.existsSync(file)) {
      passed++;
      console.log(`✓ ${file}`);
    } else {
      failed++;
      console.log(`✗ ${file}`);
    }
  });
  
  return { passed, failed, total: configs.length };
}

function testPageRoutes() {
  const pages = [
    'pages/index/index',
    'pages/login/login',
    'pages/search/search',
    'pages/orderGrab/orderGrab',
    'pages/ai/ai'
  ];
  
  let passed = 0;
  let failed = 0;
  
  pages.forEach(page => {
    const jsFile = `${page}.js`;
    const wxmlFile = `${page}.wxml`;
    const wxssFile = `${page}.wxss`;
    
    if (fs.existsSync(jsFile) && fs.existsSync(wxmlFile)) {
      passed++;
      console.log(`✓ ${page}`);
    } else {
      failed++;
      console.log(`✗ ${page}`);
    }
  });
  
  return { passed, failed, total: pages.length };
}

function testComponents() {
  const components = [
    'components/CommonButton',
    'components/CommonCard',
    'components/VirtualList'
  ];
  
  let passed = 0;
  let failed = 0;
  
  components.forEach(comp => {
    const jsFile = `${comp}/${path.basename(comp)}.js`;
    const wxmlFile = `${comp}/${path.basename(comp)}.wxml`;
    const wxssFile = `${comp}/${path.basename(comp)}.wxss`;
    const jsonFile = `${comp}/${path.basename(comp)}.json`;
    
    if (fs.existsSync(jsFile) && fs.existsSync(wxmlFile) && fs.existsSync(jsonFile)) {
      passed++;
      console.log(`✓ ${comp}`);
    } else {
      failed++;
      console.log(`✗ ${comp}`);
    }
  });
  
  return { passed, failed, total: components.length };
}

function testCloudFunctions() {
  const functions = [
    'getGrabOrders',
    'grabOrder',
    'getUserInfo',
    'checkRiderStatus',
    'getHotBoxes',
    'getBoxDetail',
    'createOrder',
    'getMyOrders',
    'getCommunityFeed',
    'reportError'
  ];
  
  let passed = 0;
  let failed = 0;
  
  functions.forEach(func => {
    const indexFile = `cloudfunctions/${func}/index.js`;
    const pkgFile = `cloudfunctions/${func}/package.json`;
    
    if (fs.existsSync(indexFile)) {
      if (fs.existsSync(pkgFile)) {
        passed++;
        console.log(`✓ ${func}`);
      } else {
        failed++;
        console.log(`⚠ ${func} (缺少package.json)`);
      }
    } else {
      failed++;
      console.log(`✗ ${func}`);
    }
  });
  
  return { passed, failed, total: functions.length };
}

function testUtils() {
  const utils = [
    'utils/cloud.js',
    'utils/toast.js',
    'utils/index.js',
    'utils/clickThrottle.js',
    'utils/errorHandler.js',
    'utils/compatibility.js',
    'utils/validator.js',
    'utils/loadingManager.js'
  ];
  
  let passed = 0;
  let failed = 0;
  
  utils.forEach(file => {
    if (fs.existsSync(file)) {
      passed++;
      console.log(`✓ ${file}`);
    } else {
      failed++;
      console.log(`✗ ${file}`);
    }
  });
  
  return { passed, failed, total: utils.length };
}

function testMockData() {
  if (!fs.existsSync('mock-data.json')) {
    return { passed: 0, failed: 1, total: 1 };
  }
  
  try {
    const data = JSON.parse(fs.readFileSync('mock-data.json', 'utf-8'));
    
    const checks = [
      { name: 'orders', count: data.orders?.length || 0, min: 5 },
      { name: 'hotBoxes', count: data.hotBoxes?.length || 0, min: 3 },
      { name: 'communityFeed', count: data.communityFeed?.length || 0, min: 3 },
      { name: 'userStats', count: data.userStats ? 1 : 0, min: 1 }
    ];
    
    let passed = 0;
    let failed = 0;
    
    checks.forEach(check => {
      if (check.count >= check.min) {
        passed++;
        console.log(`✓ ${check.name}: ${check.count} 条`);
      } else {
        failed++;
        console.log(`✗ ${check.name}: 不足${check.min}条`);
      }
    });
    
    return { passed, failed, total: checks.length };
  } catch {
    return { passed: 0, failed: 1, total: 1 };
  }
}

function testCodeQuality() {
  const checks = [
    { file: 'app.js', check: (content) => content.includes('wx.cloud.init') },
    { file: 'pages/index/index.js', check: (content) => content.includes('Page(') },
    { file: 'pages/login/login.js', check: (content) => content.includes('wx.login') },
    { file: 'utils/cloud.js', check: (content) => content.includes('callCloudFunction') }
  ];
  
  let passed = 0;
  let failed = 0;
  
  checks.forEach(({ file, check }) => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      if (check(content)) {
        passed++;
        console.log(`✓ ${file}`);
      } else {
        failed++;
        console.log(`⚠ ${file} (内容检查失败)`);
      }
    } else {
      failed++;
      console.log(`✗ ${file}`);
    }
  });
  
  return { passed, failed, total: checks.length };
}

function showNextSteps() {
  console.log('\n🚀 下一步操作:');
  console.log('===========================================');
  console.log('1. 打开微信开发者工具');
  console.log('2. 导入项目目录: d:\\kki');
  console.log('3. 配置云开发环境');
  console.log('4. 上传云函数');
  console.log('5. 创建数据库集合');
  console.log('6. 预览测试');
  console.log('===========================================');
}

async function main() {
  await runAllTests();
  showNextSteps();
}

if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  testProjectConfig,
  testPageRoutes,
  testComponents,
  testCloudFunctions,
  testUtils,
  testMockData,
  testCodeQuality,
  main
};
