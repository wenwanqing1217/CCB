const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// 输出目录
const outputDir = path.join(__dirname, 'images', 'blindbox');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 定义商品类别
const categories = {
    electronics: {
        name: '电子产品',
        color: '#1a1a3c',
        gradient: ['#121224', '#1e1e3c'],
        items: ['耳机盲盒', '充电宝盲盒', '数据线盲盒', '手机壳盲盒', '键盘盲盒']
    },
    life: {
        name: '生活用品',
        color: '#2a1a4c',
        gradient: ['#141428', '#282850'],
        items: ['洗护盲盒', '收纳盲盒', '文具盲盒', '杯子盲盒', '抱枕盲盒']
    },
    study: {
        name: '学习资料',
        color: '#1a1a3e',
        gradient: ['#0f0f23', '#232346'],
        items: ['笔记本盲盒', '教材盲盒', '考试盲盒', '资料盲盒', '工具书盲盒']
    },
    sports: {
        name: '运动装备',
        color: '#2a1e4e',
        gradient: ['#191932', '#2d2d5a'],
        items: ['球类盲盒', '护具盲盒', '配件盲盒', '装备盲盒', '服饰盲盒']
    },
    fashion: {
        name: '时尚配饰',
        color: '#3a1e5e',
        gradient: ['#1e1e3c', '#323264']
    }
};

function createGradient(ctx, width, height, colors) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
}

function createBlindboxImage(category, itemName, index) {
    const width = 750;
    const height = 750;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const cat = categories[category];
    
    // 背景渐变
    const bgGradient = createGradient(ctx, width, height, cat.gradient);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // 添加装饰性光晕
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * (width - 100) + 50;
        const y = Math.random() * (height - 100) + 50;
        const radius = Math.random() * 100 + 100;
        
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        glowGradient.addColorStop(0, 'rgba(200, 162, 255, 0.3)');
        glowGradient.addColorStop(1, 'rgba(200, 162, 255, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 边框发光效果
    ctx.strokeStyle = 'rgba(200, 162, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // 商品名称
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(147, 112, 219, 0.8)';
    ctx.shadowBlur = 20;
    ctx.fillText(itemName, width / 2, height / 2);
    
    // 类别标签
    ctx.font = '32px Arial';
    ctx.fillStyle = '#c8a2ff';
    ctx.shadowBlur = 10;
    ctx.fillText(cat.name, width / 2, height / 2 + 60);
    
    // 盲盒标签背景
    ctx.fillStyle = 'rgba(124, 58, 237, 0.8)';
    ctx.roundRect(width / 2 - 120, height - 140, 240, 60, 30);
    ctx.fill();
    
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fillText('🎁 神秘盲盒', width / 2, height - 100);
    
    return canvas;
}

// 生成所有图片
console.log('开始生成盲盒商品图片...');
let imageCount = 0;

for (const [category, info] of Object.entries(categories)) {
    console.log(`\n生成 ${info.name} 类图片...`);
    
    if (info.items) {
        for (let i = 0; i < info.items.length; i++) {
            for (let j = 0; j < 3; j++) {
                const canvas = createBlindboxImage(category, info.items[i], j);
                const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
                const filename = `${category}_${i}_${j}.jpg`;
                fs.writeFileSync(path.join(outputDir, filename), buffer);
                imageCount++;
                console.log(`  已生成: ${filename}`);
            }
        }
    }
}

console.log(`\n✅ 共生成 ${imageCount} 张盲盒商品图片`);
console.log(`📁 图片保存位置: ${outputDir}`);
