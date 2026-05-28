from docx import Document
import os

def docx_to_markdown(docx_path, output_path):
    doc = Document(docx_path)
    md_lines = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        
        # 尝试识别标题级别
        if para.style.name.startswith('Heading 1'):
            md_lines.append(f'# {text}')
        elif para.style.name.startswith('Heading 2'):
            md_lines.append(f'## {text}')
        elif para.style.name.startswith('Heading 3'):
            md_lines.append(f'### {text}')
        else:
            md_lines.append(text)
    
    # 写入markdown文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n\n'.join(md_lines))

# 转换优秀论文汇编中的docx文件
docx_to_markdown('优秀论文汇编/应用-1706410410彭灿.docx', '优秀论文_converted.md')
print('优秀论文转换完成')
