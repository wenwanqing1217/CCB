/**
 * AI辅助测试工具
 * 通过静态分析和规则检查来验证项目质量
 */

const fs = require('fs');
const path = require('path');

class AITester {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passes = [];
  }

  async run() {
    console.log('\n===========================================');
    console.log('      🤖 AI辅助测试工具');
    console.log('===========================================');
    
    const tests = [
      { name: '代码规范检查', method: 'checkCodeStyle' },
      { name: '安全漏洞扫描', method: 'checkSecurity' },
      { name: '性能问题检测', method: 'checkPerformance' },
      { name: '兼容性检查', method: 'checkCompatibility' },
      { name: '配置验证', method: 'checkConfiguration' },
      { name: '路由完整性', method: 'checkRoutes' },
      { name: '依赖检查', method: 'checkDependencies' }
    ];

    for (const { name, method } of tests) {
      console.log(`\n🔍 ${name}:`);
      console.log('------------------------------');
      await this[method]();
    }

    this.printReport();
  }

  addIssue(msg, severity = 'error', file = null) {
    this.issues.push({ msg, severity, file });
    console.log(`❌ [${severity.toUpperCase()}] ${msg} ${file ? `(${file})` : ''}`);
  }

  addWarning(msg, file = null) {
    this.warnings.push({ msg, file });
    console.log(`⚠️ [WARNING] ${msg} ${file ? `(${file})` : ''}`);
  }

  addPass(msg, file = null) {
    this.passes.push({ msg, file });
    console.log(`✅ ${msg} ${file ? `(${file})` : ''}`);
  }

  async checkCodeStyle() {
    const jsFiles = this.getJSFiles();
    
    jsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // 检查console.log
      if (content.includes('console.log(') && !file.includes('utils/logger.js')) {
        this.addWarning('存在未移除的 console.log', file);
      }
      
      // 检查未使用的变量（简单检查）
      const unusedVars = this.detectUnusedVariables(content, file);
      unusedVars.forEach(v => this.addWarning(`可能存在未使用的变量: ${v}`, file));
      
      // 检查异步错误处理
      if (content.includes('await ') && !content.includes('.catch(')) {
        this.addWarning('存在未处理的异步操作', file);
      }
      
      // 检查回调地狱
      if (this.detectCallbackHell(content)) {
        this.addWarning('可能存在回调地狱', file);
      }
      
      this.addPass('代码格式检查通过', file);
    });
  }

  async checkSecurity() {
    const files = this.getJSFiles();
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // 检查敏感信息泄露
      if (content.match(/(password|secret|token|key)\s*[=:]\s*['"][^'"]+['"]/i)) {
        this.addIssue('可能包含硬编码的敏感信息', 'critical', file);
      }
      
      // 检查SQL注入风险
      if (content.match(/db\.collection\([^)]+\)\.where\([^)]+\+.*\)/)) {
        this.addWarning('可能存在SQL注入风险', file);
      }
      
      // 检查XSS风险
      if (content.match(/innerHTML|setInnerHTML|wx\.setClipboardData/)) {
        this.addWarning('需要注意XSS防护', file);
      }
      
      // 检查数据验证
      if (!file.includes('validator.js') && content.includes('userInput')) {
        this.addWarning('建议对用户输入进行验证', file);
      }
    });
    
    this.addPass('安全检查完成');
  }

  async checkPerformance() {
    const files = this.getJSFiles();
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      
      // 检查重复渲染
      if (content.match(/setData\(.*\{\s*[\s\S]*?\s*\}\s*\)/g)?.length > 10) {
        this.addWarning('setData调用次数较多，建议优化', file);
      }
      
      // 检查图片懒加载
      if (content.includes('src=') && !content.includes('lazy-load')) {
        this.addWarning('建议使用图片懒加载', file);
      }
      
      // 检查大数组操作
      if (content.match(/(\[|\{)[\s\S]{2000,}/)) {
        this.addWarning('存在较大的字面量数据', file);
      }
    });
    
    this.addPass('性能检查完成');
  }

  async checkCompatibility() {
    const content = fs.readFileSync('app.js', 'utf-8');
    
    // 检查基础库版本
    const libVersion = this.getLibVersion();
    if (libVersion && this.compareVersion(libVersion, '2.18.0') < 0) {
      this.addWarning(`基础库版本较低: ${libVersion}`);
    }
    
    // 检查API兼容性
    const apis = ['wx.getDeviceInfo', 'wx.getWindowInfo', 'wx.cloud.callFunction'];
    apis.forEach(api => {
      if (content.includes(api)) {
        this.addPass(`使用API: ${api}`);
      }
    });
    
    // 检查兼容性工具是否导入
    if (fs.existsSync('utils/compatibility.js')) {
      this.addPass('兼容性工具已配置', 'utils/compatibility.js');
    }
  }

  async checkConfiguration() {
    // 检查app.json
    const appJson = JSON.parse(fs.readFileSync('app.json', 'utf-8'));
    
    if (!appJson.pages || appJson.pages.length === 0) {
      this.addIssue('pages数组为空', 'error', 'app.json');
    } else {
      this.addPass(`配置了 ${appJson.pages.length} 个页面`, 'app.json');
    }
    
    if (!appJson.window) {
      this.addWarning('缺少window配置', 'app.json');
    }
    
    if (!appJson.tabBar) {
      this.addWarning('缺少tabBar配置', 'app.json');
    }
    
    // 检查project.config.json
    const projectConfig = JSON.parse(fs.readFileSync('project.config.json', 'utf-8'));
    
    if (!projectConfig.appid) {
      this.addIssue('缺少appid配置', 'critical', 'project.config.json');
    } else {
      this.addPass('appid已配置', 'project.config.json');
    }
    
    if (!projectConfig.cloudfunctionRoot) {
      this.addWarning('缺少云函数目录配置', 'project.config.json');
    }
  }

  async checkRoutes() {
    const appJson = JSON.parse(fs.readFileSync('app.json', 'utf-8'));
    const pages = appJson.pages || [];
    
    pages.forEach(page => {
      const jsFile = `${page}.js`;
      const wxmlFile = `${page}.wxml`;
      
      if (!fs.existsSync(jsFile)) {
        this.addIssue(`页面文件不存在: ${jsFile}`, 'error');
      } else if (!fs.existsSync(wxmlFile)) {
        this.addWarning(`页面模板不存在: ${wxmlFile}`);
      } else {
        this.addPass(`页面完整: ${page}`);
      }
    });
  }

  async checkDependencies() {
    // 检查package.json
    if (!fs.existsSync('package.json')) {
      this.addIssue('缺少package.json', 'critical');
      return;
    }
    
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    
    if (!pkg.dependencies) {
      this.addWarning('缺少依赖配置', 'package.json');
    } else {
      this.addPass(`配置了 ${Object.keys(pkg.dependencies).length} 个依赖`, 'package.json');
    }
    
    // 检查云函数依赖
    const cloudFuncDirs = fs.readdirSync('cloudfunctions', { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    
    let validCount = 0;
    cloudFuncDirs.forEach(dir => {
      const pkgFile = `cloudfunctions/${dir}/package.json`;
      if (fs.existsSync(pkgFile)) {
        validCount++;
      } else {
        this.addWarning(`云函数缺少package.json: ${dir}`);
      }
    });
    
    this.addPass(`${validCount}/${cloudFuncDirs.length} 云函数配置完整`);
  }

  getJSFiles() {
    const files = [];
    const dirs = ['pages', 'utils', 'components'];
    
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        this.walkDir(dir, files);
      }
    });
    
    return files.filter(f => f.endsWith('.js'));
  }

  walkDir(dir, files) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = `${dir}/${item.name}`;
      if (item.isDirectory()) {
        this.walkDir(fullPath, files);
      } else {
        files.push(fullPath);
      }
    });
  }

  detectUnusedVariables(content, file) {
    const vars = [];
    const varDeclarations = content.match(/(let|const|var)\s+(\w+)/g) || [];
    const usedVars = content.match(/\b(\w+)\s*[=+\-*/%]|console\.\w+\((\w+)/g) || [];
    
    varDeclarations.forEach(decl => {
      const varName = decl.split(' ')[1];
      if (!usedVars.some(used => used.includes(varName))) {
        vars.push(varName);
      }
    });
    
    return vars.slice(0, 5);
  }

  detectCallbackHell(content) {
    const nestedCallbacks = content.match(/(\}\s*,\s*function\s*\()|(\}\s*,\s*\(\)\s*=>)/g);
    return nestedCallbacks && nestedCallbacks.length > 3;
  }

  getLibVersion() {
    try {
      const projectConfig = JSON.parse(fs.readFileSync('project.config.json', 'utf-8'));
      return projectConfig.libVersion;
    } catch {
      return null;
    }
  }

  compareVersion(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  printReport() {
    console.log('\n===========================================');
    console.log('📊 AI测试报告');
    console.log('===========================================');
    
    console.log(`\n✅ 通过检查: ${this.passes.length}`);
    console.log(`⚠️ 警告: ${this.warnings.length}`);
    console.log(`❌ 问题: ${this.issues.length}`);
    
    if (this.issues.length === 0 && this.warnings.length <= 5) {
      console.log('\n🎉 项目质量优秀！');
    } else if (this.issues.length <= 3) {
      console.log('\n👍 项目基本正常，建议修复警告');
    } else {
      console.log('\n⚠️ 项目存在较多问题，建议检查');
    }
    
    if (this.warnings.length > 0) {
      console.log('\n📋 警告详情:');
      this.warnings.slice(0, 10).forEach((w, i) => {
        console.log(`${i + 1}. ${w.msg} ${w.file ? `(${w.file})` : ''}`);
      });
    }
    
    if (this.issues.length > 0) {
      console.log('\n🔴 问题详情:');
      this.issues.slice(0, 10).forEach((i, idx) => {
        console.log(`${idx + 1}. [${i.severity}] ${i.msg} ${i.file ? `(${i.file})` : ''}`);
      });
    }
  }
}

async function main() {
  const tester = new AITester();
  await tester.run();
}

if (require.main === module) {
  main();
}

module.exports = AITester;
