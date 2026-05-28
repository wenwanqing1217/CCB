import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            # 读取document.xml
            xml_content = zip_ref.read('word/document.xml')
            
            # 解析XML
            root = ET.fromstring(xml_content)
            
            # 定义命名空间
            namespaces = {
                'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
            }
            
            # 提取所有文本
            texts = []
            for para in root.findall('.//w:p', namespaces):
                para_text = []
                for t in para.findall('.//w:t', namespaces):
                    if t.text:
                        para_text.append(t.text)
                if para_text:
                    texts.append(''.join(para_text))
            
            return '\n'.join(texts)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    text = extract_text_from_docx('撰写规范.docx')
    print("=== 撰写规范内容 ===")
    print(text)
