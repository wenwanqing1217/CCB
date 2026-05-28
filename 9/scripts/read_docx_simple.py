import zipfile
import xml.etree.ElementTree as ET

def get_docx_titles(docx_path):
    try:
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            xml_content = zip_ref.read('word/document.xml')
            root = ET.fromstring(xml_content)
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            titles = []
            for para in root.findall('.//w:p', namespaces):
                # 检查是否是标题样式
                style = para.find('.//w:pStyle', namespaces)
                if style is not None:
                    style_name = style.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
                    if style_name and ('Heading' in style_name or '标题' in style_name):
                        para_text = []
                        for t in para.findall('.//w:t', namespaces):
                            if t.text:
                                para_text.append(t.text)
                        if para_text:
                            titles.append((style_name, ''.join(para_text)))
            return titles
    except Exception as e:
        return [f'Error: {str(e)}']

titles = get_docx_titles('基于微信小程序的英语学习系统的设计与实现 答辩版.docx')
print("=== 英语学习系统论文目录结构 ===\n")
for style, title in titles:
    print(f'{style}: {title}')
