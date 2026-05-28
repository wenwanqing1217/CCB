import zipfile
import xml.etree.ElementTree as ET

docx_path = '2406910639郑茜-毕业论文 - 副本.docx'

try:
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        xml_content = zip_ref.read('word/document.xml')
        root = ET.fromstring(xml_content)
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        texts = []
        for para in root.findall('.//w:p', namespaces):
            para_text = []
            for t in para.findall('.//w:t', namespaces):
                if t.text:
                    para_text.append(t.text)
            if para_text:
                texts.append(''.join(para_text))
        
        # 保存到文件
        with open('thesis_content.txt', 'w', encoding='utf-8') as f:
            for text in texts:
                f.write(text + '\n')
        
        # 同时打印出来
        print('=== 毕业论文内容 ===\n')
        for text in texts:
            if text.strip():
                print(text + '\n')
                
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
