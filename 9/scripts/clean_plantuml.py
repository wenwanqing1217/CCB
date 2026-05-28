# -*- coding: utf-8 -*-
import re
import sys

file_path = r'c:\Users\温青\Desktop\1.3\66.md'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove all plantuml blocks
    pattern = r'\n```plantuml[\s\S]*?```\n'
    new_content = re.sub(pattern, '\n', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("PlantUML blocks removed successfully")
    print(f"Original length: {len(content)}, New length: {len(new_content)}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)