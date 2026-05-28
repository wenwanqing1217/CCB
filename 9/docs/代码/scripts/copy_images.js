const fs = require('fs');
const path = require('path');

// 源目录和目标目录
const sourceDir = path.join(__dirname, 'images');
const targetDir = path.join(__dirname, 'images', 'blindbox');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// 定义商品类别和对应的图片
const categories = {
    electronics: {
        name: '电子产品',
        items: ['耳机盲盒', '充电宝盲盒', '数据线盲盒', '手机壳盲盒', '键盘盲盒']
    },
    life: {
        name: '生活用品',
        items: ['洗护盲盒', '收纳盲盒', '文具盲盒', '杯子盲盒', '抱枕盲盒']
    },
    study: {
        name: '学习资料',
        items: ['笔记本盲盒', '教材盲盒', '考试盲盒', '资料盲盒', '工具书盲盒']
    },
    sports: {
        name: '运动装备',
        items: ['球类盲盒', '护具盲盒', '配件盲盒', '装备盲盒', '服饰盲盒']
    },
    fashion: {
        name: '时尚配饰',
        items: ['饰品盲盒', '包包盲盒', '围巾盲盒', '帽子盲盒', '眼镜盲盒']
    }
};

// 获取所有可用的图片
const availableImages = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.png') || file.endsWith('.jpg'))
    .map(file => path.join(sourceDir, file));

console.log('找到可用图片:', availableImages.length);

// 为每个类别生成图片
let imageCount = 0;

for (const [category, info] of Object.entries(categories)) {
    console.log(`\n生成 ${info.name} 类图片...`);
    
    for (let i = 0; i < info.items.length; i++) {
        // 为每个商品生成3张图片
        for (let j = 0; j < 3; j++) {
            // 循环使用可用图片
            const sourceImage = availableImages[imageCount % availableImages.length];
            const filename = `${category}_${i}_${j}.jpg`;
            const targetPath = path.join(targetDir, filename);
            
            // 复制图片
            fs.copyFileSync(sourceImage, targetPath);
            imageCount++;
            console.log(`  已生成: ${filename} (来自 ${path.basename(sourceImage)})`);
        }
    }
}

console.log(`\n✅ 共生成 ${imageCount} 张盲盒商品图片`);
console.log(`📁 图片保存位置: ${targetDir}`);
