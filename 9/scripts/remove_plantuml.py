import re

# 读取文件
with open(r'c:\Users\温青\Desktop\1.3\66.md', 'r', encoding='utf-8') as f:
    content = f.read()

# 删除所有 ```plantuml ... ``` 代码块
# 使用正则表达式匹配 ```plantuml 到 ``` 之间的内容
content = re.sub(r'\n```plantuml[\s\S]*?```\n', '\n', content)

# 写入文件
with open(r'c:\Users\温青\Desktop\1.3\66.md', 'w', encoding='utf-8') as f:
    f.write(content)

print("PlantUML代码块已删除")