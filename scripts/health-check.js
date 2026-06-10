/**
 * 项目健康检查工具
 * 一键检查项目配置是否正确
 */

const fs = require('fs');
const path = require('path');

function checkProject() {
  console.log('\n===========================================');
  console.log('      🩺 项目健康检查工具');
  console.log('===========================================');
  
  const checks = [
    {
      name: '项目配置',
      items: [
        { file: 'project.config.json', required: true },
        { file: 'app.json', required: true },
        { file: 'app.js', required: true },
        { file: 'package.json', required: true }
      ]
    },
    {
      name: '页面文件',
      items: [
        { file: 'pages/index/index.js', required: true },
        { file: 'pages/index/index.wxml', required: true },
        { file: 'pages/index/index.wxss', required: true },
        { file: 'pages/login/login.js', required: true },
        { file: 'pages/search/search.js', required: true },
        { file: 'pages/orderGrab/orderGrab.js', required: true }
      ]
    },
    {
      name: '工具函数',
      items: [
        { file: 'utils/index.js', required: true },
        { file: 'utils/cloud.js', required: true },
        { file: 'utils/toast.js', required: true },
        { file: 'utils/clickThrottle.js', required: false },
        { file: 'utils/errorHandler.js', required: false },
        { file: 'utils/compatibility.js', required: false },
        { file: 'utils/validator.js', required: false }
      ]
    },
    {
      name: '云函数',
      items: [
        { file: 'cloudfunctions/getGrabOrders/index.js', required: true },
        { file: 'cloudfunctions/grabOrder/index.js', required: true },
        { file: 'cloudfunctions/checkRiderStatus/index.js', required: true }
      ]
    },
    {
      name: '公共组件',
      items: [
        { file: 'components/CommonButton/CommonButton.js', required: false },
        { file: 'components/CommonCard/CommonCard.js', required: false },
        { file: 'components/VirtualList/VirtualList.js', required: false }
      ]
    }
  ];
  
  let totalPassed = 0;
  let totalChecked = 0;
  
  checks.forEach(category => {
    console.log(`\n📁 ${category.name}:`);
    console.log('------------------------------');
    
    category.items.forEach(item => {
      const exists = fs.existsSync(item.file);
      totalChecked++;
      
      if (exists) {
        console.log(`✓ ${item.file}`);
        totalPassed++;
      } else if (item.required) {
        console.log(`✗ ${item.file} (必需)`);
      } else {
        console.log(`○ ${item.file} (可选)`);
      }
    });
  });
  
  console.log('\n===========================================');
  console.log(`检查结果: ${totalPassed}/${totalChecked}`);
  
  const percentage = Math.round((totalPassed / totalChecked) * 100);
  if (percentage === 100) {
    console.log('✅ 项目配置完整！');
  } else if (percentage >= 80) {
    console.log('⚠️ 项目基本完整，建议补充可选文件');
  } else {
    console.log('❌ 项目缺少必需文件，请检查');
  }
  
  return percentage >= 80;
}

function checkCloudConfig() {
  console.log('\n☁️ 云开发配置检查:');
  console.log('------------------------------');
  
  let hasCloudConfig = false;
  
  try {
    const appJs = fs.readFileSync('./app.js', 'utf-8');
    if (appJs.includes('wx.cloud.init')) {
      const envMatch = appJs.match(/env:\s*['"]([^'"]+)['"]/);
      if (envMatch) {
        console.log(`✓ 云开发环境ID: ${envMatch[1]}`);
        hasCloudConfig = true;
      }
    }
  } catch (err) {
    console.log('✗ 无法读取 app.js');
  }
  
  const projectConfig = JSON.parse(fs.readFileSync('./project.config.json', 'utf-8'));
  if (projectConfig.cloudfunctionRoot) {
    console.log(`✓ 云函数目录: ${projectConfig.cloudfunctionRoot}`);
  }
  
  if (!hasCloudConfig) {
    console.log('⚠️ 建议配置云开发环境ID');
  }
  
  return hasCloudConfig;
}

function showQuickStart() {
  console.log('\n🚀 快速开始指南:');
  console.log('===========================================');
  console.log('1. 打开微信开发者工具');
  console.log('2. 导入项目目录: d:\\kki');
  console.log('3. 配置云开发环境');
  console.log('4. 上传云函数');
  console.log('5. 预览测试');
  console.log('===========================================');
}

function main() {
  const projectOk = checkProject();
  checkCloudConfig();
  showQuickStart();
  
  return projectOk;
}

if (require.main === module) {
  main();
}

module.exports = {
  checkProject,
  checkCloudConfig,
  showQuickStart,
  main
};
