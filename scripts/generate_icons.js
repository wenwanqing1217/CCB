// 生成底部导航栏图�?
const fs = require('fs');
const https = require('https');

// 图标配置
const icons = [
  { name: 'tab-home', prompt: 'home icon minimalist line style', active: true },
  { name: 'tab-home', prompt: 'home icon minimalist line style active red', active: false },
  { name: 'tab-market', prompt: 'market icon minimalist line style', active: true },
  { name: 'tab-market', prompt: 'market icon minimalist line style active red', active: false },
  { name: 'tab-publish', prompt: 'publish icon minimalist line style', active: true },
  { name: 'tab-publish', prompt: 'publish icon minimalist line style active red', active: false },
  { name: 'tab-donation', prompt: 'donation icon minimalist line style', active: true },
  { name: 'tab-donation', prompt: 'donation icon minimalist line style active red', active: false },
  { name: 'tab-profile', prompt: 'profile icon minimalist line style', active: true },
  { name: 'tab-profile', prompt: 'profile icon minimalist line style active red', active: false }
];

// 下载图像
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(filename);
      reject(err);
    });
  });
}

// 生成图标
async function generateIcons() {
  for (const icon of icons) {
    const filename = `images/${icon.name}${icon.active ? '' : '-active'}.png`;
    const prompt = icon.prompt;
    const url = `data:image/svg+xml,%253Csvg%2520xmlns%253D%2522http%253A%252F%252Fwww.w3.org%252F2000%252Fsvg%2522%2520width%253D%2522400%2522%2520height%253D%2522400%2522%253E%253Crect%2520width%253D%2522400%2522%2520height%253D%2522400%2522%2520fill%253D%2522%2523f3e8ff%2522%252F%253E%253Ctext%2520x%253D%2522200%2522%2520y%253D%2522220%2522%2520text-anchor%253D%2522middle%2522%2520font-size%253D%252260%2522%2520fill%253D%2522%2523c8a2ff%2522%253E%25E2%259C%25A8%253C%252Ftext%253E%253C%252Fsvg%253E`;
    
    try {
      await downloadImage(url, filename);
      console.log(`生成图标: ${filename}`);
    } catch (error) {
      console.error(`生成图标失败: ${filename}`, error);
    }
  }
}

// 执行生成
generateIcons();