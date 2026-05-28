/**
 * Prettier 配置
 * 代码格式化规则
 */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'none',
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'auto',
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200
      }
    }
  ]
}
