import re

with open('c:\\Users\\温青\\Desktop\\9\\22.md', 'r', encoding='utf-8') as f:
    content = f.read()

chinese_chars = re.findall(r'[\u4e00-\u9fa5]', content)
print(f'中文字符数: {len(chinese_chars)}')
