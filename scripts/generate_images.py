"""
Generate beautiful blind box product placeholder images
Categories: electronics, fashion, life, sports, study
5 items per category, 3 images each = 75 images total
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

BASE_DIR = r"D:\kki\images\blindbox"
CATEGORIES = {
    "electronics": {"emoji": "📱", "colors": ["#1a1a3e", "#2563eb", "#3b82f6"], "items": ["蓝牙耳机", "充电宝", "数据线", "键盘", "鼠标"]},
    "fashion":     {"emoji": "👕", "colors": ["#3e1a1a", "#db2777", "#ec4899"], "items": ["潮流T恤", "棒球帽", "围巾", "手链", "墨镜"]},
    "life":        {"emoji": "🏠", "colors": ["#1a3e1a", "#059669", "#10b981"], "items": ["保温杯", "台灯", "收纳盒", "雨伞", "抱枕"]},
    "sports":      {"emoji": "⚽", "colors": ["#1a1a3e", "#7c3aed", "#8b5cf6"], "items": ["运动水壶", "护腕", "跳绳", "瑜伽垫", "护膝"]},
    "study":       {"emoji": "📚", "colors": ["#3e2e1a", "#d97706", "#f59e0b"], "items": ["笔记本", "钢笔", "书签", "便签", "笔袋"]}
}

def create_gradient(width, height, colors):
    """Create a gradient background"""
    img = Image.new("RGBA", (width, height), colors[0])
    draw = ImageDraw.Draw(img)
    for y in range(height):
        ratio = y / height
        idx = min(int(ratio * len(colors)), len(colors) - 1)
        color = colors[idx]
        draw.line([(0, y), (width, y)], fill=color)
    return img

def add_noise(img, intensity=20):
    """Add subtle noise texture"""
    pixels = img.load()
    w, h = img.size
    for x in range(0, w, 2):
        for y in range(0, h, 2):
            noise = random.randint(-intensity, intensity)
            r, g, b, a = pixels[x, y]
            pixels[x, y] = (
                max(0, min(255, r + noise)),
                max(0, min(255, g + noise)),
                max(0, min(255, b + noise)),
                a
            )
    return img

def add_glow_effects(draw, w, h, color):
    """Add decorative glow circles"""
    for _ in range(3):
        cx = random.randint(w//4, 3*w//4)
        cy = random.randint(h//4, 3*h//4)
        r = random.randint(30, 80)
        for i in range(3):
            alpha = 20 - i * 5
            radius = r + i * 20
            draw.ellipse(
                [cx-radius, cy-radius, cx+radius, cy+radius],
                fill=(int(color[1:3],16), int(color[3:5],16), int(color[5:7],16), alpha)
            )

def generate_images():
    os.makedirs(BASE_DIR, exist_ok=True)
    
    for cat_name, cat_data in CATEGORIES.items():
        for item_idx in range(5):
            for img_idx in range(3):
                filename = f"{cat_name}_{item_idx}_{img_idx}.jpg"
                filepath = os.path.join(BASE_DIR, filename)
                
                # Create image with deep dark background
                w, h = 400, 400
                img = Image.new("RGBA", (w, h), (2, 2, 8, 255))
                draw = ImageDraw.Draw(img)
                
                # Add radial gradient glow
                colors = cat_data["colors"]
                for i, color in enumerate(colors):
                    cx, cy = w//2, h//2
                    for r in range(0, 200, 10):
                        alpha = max(0, int(30 * (1 - r/200)) - i * 5)
                        r_ = (r + i * 30)
                        draw.ellipse(
                            [cx-r_, cy-r_, cx+r_, cy+r_],
                            fill=(int(color[1:3],16), int(color[3:5],16), int(color[5:7],16), alpha)
                        )
                
                # Add decorative elements
                add_glow_effects(draw, w, h, colors[1])
                
                # Add a subtle grid pattern
                for x in range(0, w, 40):
                    draw.line([(x, 0), (x, h)], fill=(255, 255, 255, 5))
                for y in range(0, h, 40):
                    draw.line([(0, y), (w, y)], fill=(255, 255, 255, 5))
                
                # Add semi-transparent glass card overlay
                card_margin = 40
                draw.rounded_rectangle(
                    [card_margin, card_margin, w-card_margin, h-card_margin],
                    radius=20,
                    fill=(255, 255, 255, 15),
                    outline=(255, 255, 255, 30),
                    width=2
                )
                
                # Add category emoji (large)
                emoji = cat_data["emoji"]
                try:
                    font_size = 80
                    font = ImageFont.truetype("seguiemj.ttf", font_size)
                except:
                    font = ImageFont.load_default()
                
                # Draw emoji text
                bbox = draw.textbbox((0, 0), emoji, font=font)
                emoji_w = bbox[2] - bbox[0]
                draw.text(
                    ((w - emoji_w) // 2, h // 2 - 60),
                    emoji,
                    font=font,
                    fill=(255, 255, 255, 200)
                )
                
                # Add item name
                item_name = cat_data["items"][item_idx]
                try:
                    font = ImageFont.truetype("msyh.ttc", 28)
                except:
                    font = ImageFont.load_default()
                
                bbox = draw.textbbox((0, 0), item_name, font=font)
                text_w = bbox[2] - bbox[0]
                draw.text(
                    ((w - text_w) // 2, h // 2 + 30),
                    item_name,
                    font=font,
                    fill=(200, 162, 255, 220)
                )
                
                # Add category label
                cat_label = f"{cat_name.upper()}  ·  BLIND BOX"
                bbox = draw.textbbox((0, 0), cat_label, font=font)
                text_w = bbox[2] - bbox[0]
                draw.text(
                    ((w - text_w) // 2, h // 2 + 70),
                    cat_label,
                    font=font,
                    fill=(255, 255, 255, 60)
                )
                
                # Add corner neon accent lines
                accent_color = colors[1]
                accent_rgb = (int(accent_color[1:3],16), int(accent_color[3:5],16), int(accent_color[5:7],16))
                for corner in [(10, 10), (w-60, 10), (10, h-60), (w-60, h-60)]:
                    cx_, cy_ = corner
                    draw.arc([cx_, cy_, cx_+50, cy_+50], 0, 90, fill=accent_rgb + (80,), width=3)
                
                # Convert to RGB for JPEG saving
                rgb_img = Image.new("RGB", img.size, (2, 2, 8))
                rgb_img.paste(img, mask=img.split()[3])
                
                # Save as high quality JPEG
                rgb_img.save(filepath, "JPEG", quality=90)
                print(f"Generated: {filename}")

if __name__ == "__main__":
    generate_images()
    print("\nAll images generated successfully!")
