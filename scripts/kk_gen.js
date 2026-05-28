#!/usr/bin/env node
// 将kk.md论文转换为Word文档

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');

const mdFile = 'kk.md';
const docxFile = 'kk.docx';

function parseMarkdown(mdContent) {
  const lines = mdContent.split('\n');
  const paragraphs = [];
  
  let inCodeBlock = false;
  let codeContent = [];
  let tableLines = [];
  let inTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 代码块
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        paragraphs.push({
          type: 'code',
          content: codeContent.join('\n')
        });
        codeContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    
    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }
    
    // 表格
    if (line.includes('|') && line.split('|').length >= 3) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (!line.match(/^\|[\s-]+\|/)) {
        if (!inTable) inTable = true;
        tableLines.push(cells);
      }
      continue;
    } else if (inTable && tableLines.length > 0) {
      paragraphs.push({ type: 'table', rows: tableLines });
      tableLines = [];
      inTable = false;
    }
    
    // 标题
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+\s*/, '');
      paragraphs.push({ type: 'heading', level, text });
      continue;
    }
    
    // 分隔线
    if (line.match(/^[-=]{3,}$/)) {
      continue;
    }
    
    // 公式
    if (line.startsWith('$$')) {
      continue;
    }
    
    // 空行
    if (!line.trim()) {
      continue;
    }
    
    // 普通段落
    paragraphs.push({ type: 'paragraph', text: line });
  }
  
  return paragraphs;
}

function createDocument(paragraphs) {
  const children = [];
  
  for (const p of paragraphs) {
    if (p.type === 'heading') {
      children.push(new Paragraph({
        text: p.text,
        heading: p.level === 1 ? HeadingLevel.HEADING_1 : (p.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3),
        alignment: p.level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT
      }));
    } else if (p.type === 'code') {
      children.push(new Paragraph({
        children: [new TextRun({ text: p.content, font: 'Courier New', size: 18 })],
        style: 'Code'
      }));
    } else if (p.type === 'table') {
      const table = new Table({
        rows: p.rows.map((row, idx) => new TableRow({
          children: row.map(cell => new TableCell({
            children: [new Paragraph({
              text: cell,
              alignment: AlignmentType.CENTER
            })]
          }))
        }))
      });
      children.push(table);
    } else if (p.type === 'paragraph') {
      children.push(new Paragraph({
        children: [new TextRun({ text: p.text })],
        spacing: { line: 360 }
      }));
    }
  }
  
  return new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Code',
          name: 'Code',
          run: { font: 'Courier New', size: 18 }
        }
      ]
    },
    sections: [{
      properties: {},
      children
    }]
  });
}

async function main() {
  try {
    const mdContent = fs.readFileSync(mdFile, 'utf-8');
    const paragraphs = parseMarkdown(mdContent);
    const doc = createDocument(paragraphs);
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(docxFile, buffer);
    console.log('✓ 论文已生成: ' + docxFile);
  } catch (err) {
    console.error('错误:', err.message);
  }
}

main();
