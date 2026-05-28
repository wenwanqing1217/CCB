const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function convertDocxToMarkdown(docxPath, outputPath) {
  try {
    const data = fs.readFileSync(docxPath);
    const zip = await JSZip.loadAsync(data);
    
    // 读取文档内容
    const contentXml = await zip.file('word/document.xml').async('string');
    
    // 解析 XML 并转换为 Markdown
    let markdown = parseDocxXml(contentXml);
    
    // 清理多余的空行
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    fs.writeFileSync(outputPath, markdown, 'utf8');
    console.log(`转换完成！输出文件: ${outputPath}`);
    
    return markdown;
  } catch (error) {
    console.error('转换失败:', error.message);
    throw error;
  }
}

function parseDocxXml(xml) {
  let result = '';
  
  // 移除 XML 声明和命名空间
  xml = xml.replace(/<\?xml[^>]*\?>/g, '');
  xml = xml.replace(/w:/g, '');
  
  // 处理段落
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/g;
  let match;
  
  while ((match = paragraphRegex.exec(xml)) !== null) {
    let paragraph = match[1];
    
    // 移除标签但保留文本
    paragraph = paragraph.replace(/<[^>]*>/g, '');
    
    // 处理特殊字符
    paragraph = paragraph.replace(/&lt;/g, '<');
    paragraph = paragraph.replace(/&gt;/g, '>');
    paragraph = paragraph.replace(/&amp;/g, '&');
    paragraph = paragraph.replace(/&quot;/g, '"');
    paragraph = paragraph.replace(/&#160;/g, ' ');
    paragraph = paragraph.replace(/&#xa;/g, '\n');
    
    // 尝试识别标题样式
    if (match[0].includes('Heading1') || match[0].includes('heading 1')) {
      result += `# ${paragraph}\n\n`;
    } else if (match[0].includes('Heading2') || match[0].includes('heading 2')) {
      result += `## ${paragraph}\n\n`;
    } else if (match[0].includes('Heading3') || match[0].includes('heading 3')) {
      result += `### ${paragraph}\n\n`;
    } else if (match[0].includes('Heading4') || match[0].includes('heading 4')) {
      result += `#### ${paragraph}\n\n`;
    } else {
      // 普通段落
      if (paragraph.trim()) {
        result += `${paragraph}\n\n`;
      }
    }
  }
  
  return result;
}

// 执行转换
const docxPath = path.join(__dirname, 'docs', '77.docx');
const outputPath = path.join(__dirname, 'docs', '77_converted.md');

convertDocxToMarkdown(docxPath, outputPath);