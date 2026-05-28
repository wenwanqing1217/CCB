const fs = require('fs');
let content = fs.readFileSync('generate_paper.js', 'utf8');
// 找到所有含有中文引号的字符串并修复
// 先备份
fs.writeFileSync('generate_paper_backup.js', content);
// 替换所有中文引号为单引号（英文）
content = content.replace(/\u201c/g, "'");  // "
content = content.replace(/\u201d/g, "'");  // "
fs.writeFileSync('generate_paper.js', content);
console.log('Fixed Chinese quotes!');