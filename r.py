import docx
doc = docx.Document("D:/kki/suggestions.doc")
for p in doc.paragraphs:
    if p.text.strip(): print(p.text)