#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成盲盒商品示例图片
"""

from PIL import Image, ImageDraw, ImageFont
import os
import random

# 设置中文字体
font_path = "C:/Windows/Fonts/simhei.ttf"  # 黑体
try:
    font_large = ImageFont.truetype(font_path, 60)
    font_medium = ImageFont.truetype(font_path, 40)
    font_small = ImageFont.truetype(font_path, 30)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()

# 输出目录
output_dir = "c:/Users/温青/Desktop/1.3/images/blindbox"
os.makedirs(output_dir, exist_ok=True)

# 定义渐变背景色（紫色霓虹风格）
def create_gradient_background(width, height, color1, color2):
    """创建渐变背景"""
    image = Image.new('RGB', (width, height), color1)
    draw = ImageDraw.Draw(image)
    
    for y in range(height):
        r = int(color1[0] + (color2[0] - color1[0]) * y / height)
        g = int(color1[1] + (color2[1] - color1[1]) * y / height)
        b = int(color1[2] + (color2[2] - color1[2]) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    return image

# 定义商品类别和颜色主题
categories = {
    "electronics": {
        "name": "电子产品",
        "colors": [(18, 18, 36), (30, 30, 60)],  # 深蓝紫色
        "emoji": "💻",
        "items": ["耳机盲盒", "充电宝盲盒", "数据线盲盒", "手机壳盲盒", "键盘盲盒"]
    },
    "life": {
        "name": "生活用品",
        "colors": [(20, 20, 40), (40, 30, 70)],  # 紫色调
        "emoji": "🧴",
        "items": ["洗护盲盒", "收纳盲盒", "文具盲盒", "杯子盲盒", "抱枕盲盒"]
    },
    "study": {
        "name": "学习资料",
        "colors": [(15, 15, 35), (35, 25, 65)],  # 深紫色
        "emoji": "📚",
        "items": ["笔记本盲盒", "教材盲盒", "考试盲盒", "资料盲盒", "工具书盲盒"]
    },
    "sports": {
        "name": "运动装备",
        "colors": [(25, 20, 45), (45, 35, 75)],  # 紫蓝色
        "emoji": "⚽",
        "items": ["球类盲盒", "护具盲盒", "配件盲盒", "装备盲盒", "服饰盲盒"]
    },
    "fashion": {
        "name": "时尚配饰",
        "colors": [(30, 20, 50), (50, 35, 80)],  # 亮紫色
        "emoji": "💍",
        "items": ["饰品盲盒", "包包盲盒", "围巾盲盒", "帽子盲盒", "眼镜盲盒"]
    }
}

def create_blindbox_image(category, item_name, index, size=(750, 750)):
    """创建单个盲盒商品图片"""
    width, height = size
    colors = categories[category]["colors"]
    emoji = categories[category]["emoji"]
    
    # 创建渐变背景
    image = create_gradient_background(width, height, colors[0], colors[1])
    draw = ImageDraw.Draw(image)
    
    # 添加装饰性光晕效果
    for i in range(5):
        x = random.randint(50, width-50)
        y = random.randint(50, height-50)
        radius = random.randint(100, 200)
        alpha = random.randint(20, 50)
        # 绘制光晕
        for r in range(radius, 0, -5):
            color = (200, 162, 255, alpha)
            draw.ellipse([x-r, y-r, x+r, y+r], fill=(color[0], color[1], color[2]))
    
    # 添加边框发光效果
    border_width = 4
    for i in range(border_width):
        alpha = int(100 - i * 20)
        draw.rectangle([i, i, width-1-i, height-1-i], 
                      outline=(200, 162, 255), width=1)
    
    # 添加盲盒图标
    bbox = draw.textbbox((0, 0), emoji, font=font_large)
    emoji_width = bbox[2] - bbox[0]
    emoji_height = bbox[3] - bbox[1]
    emoji_x = (width - emoji_width) // 2
    emoji_y = height // 3 - emoji_height // 2
    draw.text((emoji_x, emoji_y), emoji, font=font_large, fill=(255, 255, 255))
    
    # 添加商品名称
    bbox = draw.textbbox((0, 0), item_name, font=font_medium)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = height * 2 // 3
    
    # 文字发光效果
    for offset in [(2, 2), (-2, -2), (2, -2), (-2, 2)]:
        draw.text((text_x + offset[0], text_y + offset[1]), 
                 item_name, font=font_medium, fill=(147, 112, 219))
    draw.text((text_x, text_y), item_name, font=font_medium, fill=(255, 255, 255))
    
    # 添加"盲盒"标签
    label_text = "🎁 神秘盲盒"
    bbox = draw.textbbox((0, 0), label_text, font=font_small)
    label_width = bbox[2] - bbox[0]
    label_x = (width - label_width) // 2
    label_y = height - 100
    
    # 标签背景
    padding = 15
    draw.rounded_rectangle([label_x - padding, label_y - padding, 
                           label_x + label_width + padding, label_y + 50 + padding],
                          radius=30, fill=(124, 58, 237, 180))
    draw.text((label_x, label_y), label_text, font=font_small, fill=(255, 255, 255))
    
    return image

def main():
    """生成所有盲盒商品图片"""
    print("开始生成盲盒商品图片...")
    
    image_count = 0
    
    for category, info in categories.items():
        print(f"\n生成 {info['name']} 类图片...")
        
        for i, item in enumerate(info["items"]):
            # 为每个商品生成3张不同角度的图片
            for j in range(3):
                filename = f"{category}_{i}_{j}.jpg"
                filepath = os.path.join(output_dir, filename)
                
                # 创建图片
                image = create_blindbox_image(category, item, j)
                
                # 保存图片
                image.save(filepath, "JPEG", quality=90)
                image_count += 1
                print(f"  已生成: {filename}")
    
    print(f"\n✅ 共生成 {image_count} 张盲盒商品图片")
    print(f"📁 图片保存位置: {output_dir}")

if __name__ == "__main__":
    main()
