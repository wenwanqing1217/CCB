/**
 * UI交互测试工具
 * 验证页面按钮点击跳转逻辑是否正确
 */

const fs = require('fs');
const path = require('path');

class UITester {
  constructor() {
    this.results = {
      passed: [],
      warnings: [],
      errors: []
    };
  }

  run() {
    console.log('\n===========================================');
    console.log('      🎨 UI交互测试工具');
    console.log('===========================================');

    const tests = [
      { name: '首页按钮跳转测试', method: 'testIndexPage' },
      { name: 'AI助手交互测试', method: 'testAIPage' },
      { name: '盲盒列表交互测试', method: 'testBoxListPage' },
      { name: '抢单页面交互测试', method: 'testOrderGrabPage' },
      { name: '路由配置验证', method: 'testRouteConfig' }
    ];

    tests.forEach(({ name, method }) => {
      console.log(`\n🔍 ${name}:`);
      console.log('------------------------------');
      this[method]();
    });

    this.printReport();
  }

  addPass(msg, details = '') {
    this.results.passed.push({ msg, details });
    console.log(`✅ ${msg} ${details ? `(${details})` : ''}`);
  }

  addWarning(msg, details = '') {
    this.results.warnings.push({ msg, details });
    console.log(`⚠️ ${msg} ${details ? `(${details})` : ''}`);
  }

  addError(msg, details = '') {
    this.results.errors.push({ msg, details });
    console.log(`❌ ${msg} ${details ? `(${details})` : ''}`);
  }

  testIndexPage() {
    const jsFile = 'pages/index/index.js';
    const wxmlFile = 'pages/index/index.wxml';

    if (!fs.existsSync(jsFile)) {
      this.addError('首页JS文件不存在', jsFile);
      return;
    }

    const content = fs.readFileSync(jsFile, 'utf-8');

    const buttons = [
      { name: '立即抢单赚钱', functionName: 'navigateToOrderGrab', expectedUrl: '/orderGrab/orderGrab' },
      { name: '神秘盲盒', functionName: 'navigateToBlindBox', expectedUrl: '/box-list/box-list' },
      { name: '校园社区', functionName: 'navigateToCommunity', expectedUrl: '/community/community' },
      { name: '发布盲盒', functionName: 'navigateToPublish', expectedUrl: '/box-publish/box-publish' },
      { name: '骑手中心', functionName: 'navigateToRider', expectedUrl: '/rider/rider' },
      { name: 'AI助手', functionName: 'navigateToAI', expectedUrl: '/ai/ai' },
      { name: '搜索确认', functionName: 'onSearchConfirm', expectedUrl: '/box-list/box-list' }
    ];

    buttons.forEach(btn => {
      if (content.includes(btn.functionName)) {
        if (content.includes(btn.expectedUrl)) {
          this.addPass(`${btn.name} 跳转正确`, `${btn.functionName} → ${btn.expectedUrl}`);
        } else {
          this.addWarning(`${btn.name} 跳转URL不匹配`, `${btn.functionName}`);
        }
      } else {
        this.addError(`${btn.name} 点击函数不存在`, btn.functionName);
      }
    });

    if (content.includes('wx.vibrateShort')) {
      this.addPass('按钮点击震动反馈已配置');
    } else {
      this.addWarning('按钮点击震动反馈未配置');
    }

    if (content.includes('debounce')) {
      this.addPass('按钮防抖已配置');
    } else {
      this.addWarning('按钮防抖未配置');
    }
  }

  testAIPage() {
    const jsFile = 'pages/ai/ai.js';

    if (!fs.existsSync(jsFile)) {
      this.addError('AI页面JS文件不存在', jsFile);
      return;
    }

    const content = fs.readFileSync(jsFile, 'utf-8');

    const features = [
      { name: '时间查询', keyword: '几点', action: '时间' },
      { name: '日期查询', keyword: '几号', action: '日期' },
      { name: '问候语', keyword: '早上好', action: '问候' },
      { name: '天气查询', keyword: '天气', action: '天气' },
      { name: '消息查询', keyword: '消息', action: '消息' },
      { name: '订单查询', keyword: '订单', action: '订单' },
      { name: '发布盲盒', keyword: '发布', action: '发布' },
      { name: '购买商品', keyword: '买', action: '购物' },
      { name: '骑手功能', keyword: '骑手', action: '骑手' },
      { name: '个人中心', keyword: '我的', action: '个人中心' },
      { name: '社区功能', keyword: '社区', action: '社区' },
      { name: '帮助功能', keyword: '帮助', action: '帮助' }
    ];

    features.forEach(feature => {
      if (content.includes(feature.keyword)) {
        this.addPass(`${feature.name} 功能已实现`, `识别关键词: ${feature.keyword}`);
      } else {
        this.addWarning(`${feature.name} 功能未实现`, `缺少关键词: ${feature.keyword}`);
      }
    });

    const actions = [
      'navigateToMessage',
      'navigateToOrder',
      'navigateToPublish',
      'navigateToMarket',
      'navigateToRider',
      'navigateToProfile',
      'navigateToCommunity',
      'navigateToIndex'
    ];

    const hasExecuteAction = content.includes('executeAction');
    if (hasExecuteAction) {
      this.addPass('executeAction 函数已定义');
      actions.forEach(action => {
        if (content.includes(action)) {
          this.addPass(`${action} 跳转动作已配置`);
        } else {
          this.addWarning(`${action} 跳转动作未配置`);
        }
      });
    } else {
      this.addError('executeAction 函数未定义');
    }
  }

  testBoxListPage() {
    const jsFile = 'pages/box-list/box-list.js';
    const wxmlFile = 'pages/box-list/box-list.wxml';

    if (!fs.existsSync(jsFile)) {
      this.addError('盲盒列表JS文件不存在', jsFile);
      return;
    }

    const content = fs.readFileSync(jsFile, 'utf-8');

    if (content.includes('goDetail')) {
      if (content.includes('/pages/box-detail/box-detail')) {
        this.addPass('盲盒卡片点击跳转正确', 'goDetail → box-detail');
      } else {
        this.addWarning('盲盒卡片跳转URL不匹配');
      }
    } else {
      this.addError('goDetail 函数不存在');
    }

    if (content.includes('goPublish')) {
      this.addPass('去发布按钮已配置', 'goPublish');
    } else {
      this.addWarning('去发布按钮未配置');
    }

    if (content.includes('bindTypeChange')) {
      this.addPass('类型筛选功能已配置');
    } else {
      this.addWarning('类型筛选功能未配置');
    }

    if (content.includes('bindCampusChange')) {
      this.addPass('楼栋筛选功能已配置');
    } else {
      this.addWarning('楼栋筛选功能未配置');
    }
  }

  testOrderGrabPage() {
    const jsFile = 'pages/orderGrab/orderGrab.js';

    if (!fs.existsSync(jsFile)) {
      this.addError('抢单页面JS文件不存在', jsFile);
      return;
    }

    const content = fs.readFileSync(jsFile, 'utf-8');

    if (content.includes('grabOrder')) {
      this.addPass('抢单按钮点击函数已定义', 'grabOrder');

      if (content.includes('wx.navigateTo') && content.includes('/pages/login/login')) {
        this.addPass('未登录时正确跳转登录页');
      } else {
        this.addWarning('未登录跳转逻辑可能不完整');
      }

      if (content.includes('clickThrottle.canClick')) {
        this.addPass('防重复点击已配置');
      } else {
        this.addWarning('防重复点击未配置');
      }

      if (content.includes('toast.confirm')) {
        this.addPass('抢单确认对话框已配置');
      } else {
        this.addWarning('抢单确认对话框未配置');
      }
    } else {
      this.addError('grabOrder 函数不存在');
    }

    if (content.includes('setFilter')) {
      this.addPass('订单筛选功能已配置', 'setFilter');
    } else {
      this.addWarning('订单筛选功能未配置');
    }

    if (content.includes('navigateToRider')) {
      this.addPass('申请骑手按钮已配置', 'navigateToRider');
    } else {
      this.addWarning('申请骑手按钮未配置');
    }
  }

  testRouteConfig() {
    const appJson = JSON.parse(fs.readFileSync('app.json', 'utf-8'));
    const pages = appJson.pages || [];
    const tabBar = appJson.tabBar || {};
    const tabPages = tabBar.list || [];

    this.addPass(`已配置 ${pages.length} 个页面`);
    this.addPass(`已配置 ${tabPages.length} 个Tab页`);

    const requiredPages = [
      'pages/index/index',
      'pages/login/login',
      'pages/ai/ai',
      'pages/orderGrab/orderGrab',
      'pages/box-list/box-list',
      'pages/box-detail/box-detail',
      'pages/rider/rider'
    ];

    requiredPages.forEach(page => {
      if (pages.includes(page)) {
        this.addPass(`${page} 已注册`);
      } else {
        this.addError(`${page} 未注册`);
      }
    });

    const tabPagePaths = tabPages.map(item => item.pagePath);
    tabPagePaths.forEach(page => {
      if (pages.includes(page)) {
        this.addPass(`Tab页 ${page} 已注册`);
      } else {
        this.addError(`Tab页 ${page} 未在pages列表中`);
      }
    });
  }

  printReport() {
    console.log('\n===========================================');
    console.log('📊 UI交互测试报告');
    console.log('===========================================');

    console.log(`\n✅ 通过测试: ${this.results.passed.length}`);
    console.log(`⚠️ 警告: ${this.results.warnings.length}`);
    console.log(`❌ 错误: ${this.results.errors.length}`);

    if (this.results.errors.length === 0) {
      console.log('\n🎉 UI交互功能完整！');
    } else if (this.results.errors.length <= 2) {
      console.log('\n👍 UI交互基本正常，建议修复警告');
    } else {
      console.log('\n⚠️ UI交互存在较多问题，建议检查');
    }

    if (this.results.warnings.length > 0) {
      console.log('\n📋 警告详情:');
      this.results.warnings.slice(0, 10).forEach((w, i) => {
        console.log(`${i + 1}. ${w.msg} ${w.details ? `(${w.details})` : ''}`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log('\n🔴 错误详情:');
      this.results.errors.slice(0, 10).forEach((e, i) => {
        console.log(`${i + 1}. ${e.msg} ${e.details ? `(${e.details})` : ''}`);
      });
    }
  }
}

function main() {
  const tester = new UITester();
  tester.run();
}

if (require.main === module) {
  main();
}

module.exports = UITester;
