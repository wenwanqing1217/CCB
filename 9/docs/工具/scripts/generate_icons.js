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
    const url = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;
    
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