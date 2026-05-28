/**
 * 基于 论文_完整版.md 生成Word文档
 * 论文_完整版.md 内容更完整，符合学术论文规范
 */
const { Document, Packer, Paragraph, TextRun, Header, Footer, 
        AlignmentType, HeadingLevel, PageBreak,
        Table, TableRow, TableCell, BorderStyle, WidthType, ShadingType,
        LevelFormat } = require('docx');
const fs = require('fs');
const path = require('path');

// 读取md文件
const mdPath = path.join(__dirname, '论文_完整版.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// 工具函数：创建标题段落
function createHeading(text, level) {
    const sizes = { 1: 32, 2: 28, 3: 24, 4: 22 };
    const runs = [];
    
    // 处理 Markdown 的 ## 标题
    let cleanText = text.replace(/^#+\s*/, '');
    
    // 处理 <sup> 标签为上标
    const supPattern = /<sup>\[(\d+)\]<\/sup>/g;
    let lastIndex = 0;
    let match;
    let parts = [];
    
    while ((match = supPattern.exec(cleanText)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: cleanText.substring(lastIndex, match.index), isSup: false });
        }
        parts.push({ text: '[' + match[1] + ']', isSup: true });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < cleanText.length) {
        parts.push({ text: cleanText.substring(lastIndex), isSup: false });
    }
    
    if (parts.length > 0) {
        parts.forEach(part => {
            runs.push(new TextRun({ text: part.text, size: sizes[level], font: 'SimSun', bold: level <= 2 }));
        });
    } else {
        runs.push(new TextRun({ text: cleanText, size: sizes[level], font: 'SimSun', bold: level <= 2 }));
    }
    
    return new Paragraph({
        heading: level === 1 ? HeadingLevel.HEADING_1 : (level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3),
        children: runs,
        spacing: { before: level === 1 ? 400 : 240, after: level === 1 ? 200 : 120 }
    });
}

// 工具函数：创建普通段落
function createParagraph(text, options = {}) {
    const runs = [];
    
    // 处理 <sup> 标签
    const supPattern = /<sup>\[(\d+)\]<\/sup>/g;
    let lastIndex = 0;
    let match;
    let parts = [];
    
    while ((match = supPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), isSup: false });
        }
        parts.push({ text: '[' + match[1] + ']', isSup: true });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), isSup: false });
    }
    
    if (parts.length > 0) {
        parts.forEach(part => {
            runs.push(new TextRun({ text: part.text, size: options.size || 22, font: 'SimSun', bold: options.bold || false }));
        });
    } else {
        runs.push(new TextRun({ text: text, size: options.size || 22, font: 'SimSun', bold: options.bold || false }));
    }
    
    return new Paragraph({
        alignment: options.alignment || AlignmentType.JUSTIFIED,
        children: runs,
        spacing: { before: 60, after: 60, line: 360, lineRule: 'auto' },
        indent: options.indent ? { firstLine: options.indent } : { firstLine: 440 }
    });
}

// 工具函数：创建居中段落
function createCenterParagraph(text, options = {}) {
    const runs = [];
    
    // 处理 <sup> 标签
    const supPattern = /<sup>\[(\d+)\]<\/sup>/g;
    let lastIndex = 0;
    let match;
    let parts = [];
    
    while ((match = supPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index), isSup: false });
        }
        parts.push({ text: '[' + match[1] + ']', isSup: true });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex), isSup: false });
    }
    
    if (parts.length > 0) {
        parts.forEach(part => {
            runs.push(new TextRun({ text: part.text, size: options.size || 22, font: 'SimSun', bold: options.bold || false }));
        });
    } else {
        runs.push(new TextRun({ text: text, size: options.size || 22, font: 'SimSun', bold: options.bold || false }));
    }
    
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        children: runs,
        spacing: { before: 60, after: 60 }
    });
}

// 工具函数：创建空行
function createEmptyLine() {
    return new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 60, after: 60 } });
}

// 解析Markdown内容
function parseContent(mdContent) {
    const paragraphs = [];
    const lines = mdContent.split('\n');
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockType = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 跳过表格分隔符行
        if (line.match(/^[\|:-\s]+$/) || line.match(/^!\[\]\(/)) continue;
        
        // 代码块处理
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeBlockType = line.substring(3) || 'javascript';
                codeBlockContent = [];
            } else {
                inCodeBlock = false;
                // 创建代码块段落
                if (codeBlockContent.length > 0) {
                    const codeText = codeBlockContent.join('\n');
                    paragraphs.push(new Paragraph({
                        children: [new TextRun({ text: codeText, font: 'Courier New', size: 18 })],
                        spacing: { before: 120, after: 120 },
                        indent: { left: 360 }
                    }));
                }
                codeBlockContent = [];
            }
            continue;
        }
        
        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }
        
        // 标题处理
        if (line.startsWith('# ')) {
            paragraphs.push(createCenterParagraph(line.substring(2), { size: 32, bold: true }));
            paragraphs.push(createEmptyLine());
        } else if (line.startsWith('## ')) {
            if (line.includes('摘要') || line.includes('Abstract') || line.includes('目录') || line.includes('参考文献') || line.includes('致谢')) {
                paragraphs.push(createCenterParagraph(line.substring(3), { size: 26, bold: true }));
            } else {
                paragraphs.push(createHeading(line, 2));
            }
        } else if (line.startsWith('### ')) {
            paragraphs.push(createHeading(line, 3));
        } else if (line.startsWith('#### ')) {
            paragraphs.push(createHeading(line, 4));
        }
        // 分割线
        else if (line === '---') {
            paragraphs.push(createEmptyLine());
        }
        // 普通段落
        else if (line.trim()) {
            // 跳过目录本身
            if (line.match(/^\*\*/) || line.match(/^\d+\./)) continue;
            
            // 处理表格标题
            if (line.startsWith('**') && line.endsWith('**') && (line.includes('表') || line.includes('竞品'))) {
                paragraphs.push(new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: line.replace(/\*\*/g, ''), size: 22, font: 'SimSun', bold: true })],
                    spacing: { before: 120, after: 60 }
                }));
            }
            // 处理普通段落
            else if (!line.startsWith('|')) {
                paragraphs.push(createParagraph(line));
            }
        }
    }
    
    return paragraphs;
}

// 创建文档
async function createDocument() {
    const paragraphs = parseContent(mdContent);
    
    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'SimSun', size: 22 }
                }
            },
            paragraphStyles: [
                {
                    id: 'Heading1',
                    name: 'Heading 1',
                    basedOn: 'Normal',
                    next: 'Normal',
                    quickFormat: true,
                    run: { size: 32, bold: true, font: 'SimSun' },
                    paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
                },
                {
                    id: 'Heading2',
                    name: 'Heading 2',
                    basedOn: 'Normal',
                    next: 'Normal',
                    quickFormat: true,
                    run: { size: 28, bold: true, font: 'SimSun' },
                    paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
                },
                {
                    id: 'Heading3',
                    name: 'Heading 3',
                    basedOn: 'Normal',
                    next: 'Normal',
                    quickFormat: true,
                    run: { size: 24, bold: true, font: 'SimSun' },
                    paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    size: { width: 11906, height: 16838 }, // A4
                    margin: { top: 1701, right: 1418, bottom: 1418, left: 1418 }
                }
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun({ text: '第 页', font: 'SimSun', size: 21 })
                            ]
                        })
                    ]
                })
            },
            children: paragraphs
        }]
    });
    
    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, '论文_完整版_正式.docx');
    fs.writeFileSync(outputPath, buffer);
    console.log('文档生成成功: ' + outputPath);
}

createDocument().catch(console.error);
