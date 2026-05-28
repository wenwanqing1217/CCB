const fs = require('fs');
let xml = fs.readFileSync('模板_内容.xml', 'utf8');
let texts = [];
let re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
let m;
while((m = re.exec(xml)) !== null) texts.push(m[1]);
texts = texts.filter(t => t.trim() && !t.startsWith('<?') && t.length > 1);
console.log(texts.slice(150, 300).join('\n'));