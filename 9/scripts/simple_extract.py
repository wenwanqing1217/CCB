import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text_from_docx(docx_path):
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
            
            return texts
    except Exception as e:
        return [f"Error: {str(e)}"]

print("=== 撰写规范内容 ===")
specs = extract_text_from_docx('撰写规范.docx')
for i, text in enumerate(specs):
    print(f"{i}: {text}")

print("\n\n=== 论文完整版内容 ===")
paper = extract_text_from_docx('论文_完整版.docx')
for i, text in enumerate(paper[:100]):  # 只打印前100行
    print(f"{i}: {text}")
