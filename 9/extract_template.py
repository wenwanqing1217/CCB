import zipfile, re, os, sys

docx_path = r'c:\Users\温青\Desktop\9\2025论文模板1.docx'
output_path = r'c:\Users\温青\Desktop\9\2025论文模板1_extracted.txt'

try:
    with zipfile.ZipFile(docx_path, 'r') as z:
        print("Files:", z.namelist()[:10])
        xml = z.read('word/document.xml').decode('utf-8', errors='ignore')
        texts = re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml)
        text = '\n'.join(texts)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Extracted {len(text)} chars to {output_path}")
        print("First 3000 chars:")
        print(text[:3000])
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
