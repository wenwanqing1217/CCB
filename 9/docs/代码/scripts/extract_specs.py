import zipfile
import xml.etree.ElementTree as ET

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

specs = extract_text_from_docx('撰写规范.docx')

with open('撰写规范.md', 'w', encoding='utf-8') as f:
    for text in specs:
        f.write(text + '\n\n')

print("撰写规范提取完成！")
for i, text in enumerate(specs):
    print(f"{i}: {text}")
