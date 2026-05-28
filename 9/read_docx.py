from docx import Document
import sys

def read_docx(file_path):
    doc = Document(file_path)
    content = []
    for para in doc.paragraphs:
        if para.text.strip():
            content.append(para.text)
    return '\n\n'.join(content)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python read_docx.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    content = read_docx(file_path)
    print(content)