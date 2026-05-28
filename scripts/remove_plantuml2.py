import re

# 读取文件
with open(r'c:\Users\温青\Desktop\1.3\66.md', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 找到所有 ```plantuml 开始的行和 ``` 结束的行
new_lines = []
i = 0
in_plantuml = False

while i < len(lines):
    line = lines[i]
    if '```plantuml' in line:
        in_plantuml = True
        i += 1
        continue
    if in_plantuml:
        if line.strip() == '```':
            in_plantuml = False
            i += 1
            continue
        i += 1
        continue
    new_lines.append(line)
    i += 1

# 写入文件
with open(r'c:\Users\温青\Desktop\1.3\66.md', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("删除完成")