import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path, limit=200):
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
                if len(texts) >= limit:
                    break
            return texts
    except Exception as e:
        return [f'Error: {str(e)}']

print("=== 优秀应用型论文结构 ===\n")
thesis = extract_text_from_docx('优秀论文汇编/应用-1706410410彭灿.docx', 200)
for i, text in enumerate(thesis):
    print(f'{i+1}. {text}')
