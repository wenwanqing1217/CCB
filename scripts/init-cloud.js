/**
 * 云开发环境初始化脚本
 * 使用前请确保：
 * 1. 已在微信开发者工具中开通云开发
 * 2. 已创建云开发环境
 * 3. 已配置云函数上传权限
 */

const fs = require('fs');
const path = require('path');

const config = {
  // 云开发环境ID（请替换为你的环境ID）
  envId: 'cloud1-0g18d9ik5f541e32',
  
  // 云函数目录
  cloudfunctionsDir: './cloudfunctions',
  
  // 需要部署的云函数列表
  functionsToDeploy: [
    'getGrabOrders',
    'grabOrder',
    'getUserInfo',
    'checkRiderStatus',
    'getHotBoxes',
    'getBoxDetail',
    'publishBox',
    'createOrder',
    'getMyOrders',
    'getCommunityFeed',
    'reportError'
  ]
};

function checkEnvironment() {
  console.log('\n📋 环境检查...');
  
  const checks = [
    { name: 'cloudfunctions目录', path: config.cloudfunctionsDir, type: 'dir' },
    { name: 'package.json', path: './package.json', type: 'file' },
    { name: 'app.js', path: './app.js', type: 'file' },
    { name: 'project.config.json', path: './project.config.json', type: 'file' }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    const exists = check.type === 'dir' 
      ? fs.existsSync(check.path) 
      : fs.existsSync(check.path);
    
    if (exists) {
      console.log(`✓ ${check.name}: ${check.path}`);
    } else {
      console.log(`✗ ${check.name}: ${check.path} 不存在`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

function generateConfig() {
  console.log('\n📝 生成配置文件...');
  
  const envConfig = {
    envId: config.envId,
    createdAt: new Date().toISOString(),
    functions: config.functionsToDeploy
  };
  
  fs.writeFileSync('./cloud-config.json', JSON.stringify(envConfig, null, 2));
  console.log('✓ cloud-config.json 已生成');
  
  // 更新 app.js 中的云开发配置
  updateAppConfig();
}

function updateAppConfig() {
  try {
    let appJs = fs.readFileSync('./app.js', 'utf-8');
    
    // 更新云开发初始化配置
    const oldInit = /wx\.cloud\.init\(\s*\{[\s\S]*?\s*\}\s*\)/;
    const newInit = `wx.cloud.init({
        env: '${config.envId}',
        traceUser: true,
        timeout: 30000
      })`;
    
    appJs = appJs.replace(oldInit, newInit);
    fs.writeFileSync('./app.js', appJs);
    console.log('✓ app.js 云开发配置已更新');
  } catch (err) {
    console.log('✗ 更新 app.js 失败:', err.message);
  }
}

function showDeployInstructions() {
  console.log('\n🚀 部署说明:');
  console.log('===========================================');
  console.log('1. 打开微信开发者工具');
  console.log('2. 确保已登录微信账号');
  console.log('3. 在云开发面板中创建环境');
  console.log('4. 环境ID:', config.envId);
  console.log('5. 右键云函数目录选择"上传并部署"');
  console.log('6. 等待部署完成');
  console.log('===========================================');
  
  console.log('\n📦 需要部署的云函数:');
  config.functionsToDeploy.forEach((func, index) => {
    console.log(`${index + 1}. ${func}`);
  });
}

function main() {
  console.log('\n===========================================');
  console.log('   云开发环境配置工具');
  console.log('===========================================');
  
  const envOk = checkEnvironment();
  
  if (!envOk) {
    console.log('\n❌ 环境检查未通过，请检查上述文件是否存在');
    process.exit(1);
  }
  
  generateConfig();
  showDeployInstructions();
  
  console.log('\n✅ 配置完成！');
  console.log('请按照上述说明在微信开发者工具中部署云函数');
}

if (require.main === module) {
  main();
}

module.exports = {
  config,
  checkEnvironment,
  generateConfig,
  showDeployInstructions
};
