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

print("=== 毕业论文内容 ===\n")
thesis = extract_text_from_docx('2406910639郑茜-毕业论文 - 副本.docx')
for i, text in enumerate(thesis):
    print(f"{text}\n")
