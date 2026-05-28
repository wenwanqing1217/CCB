/**
 * ESLint 配置
 * 微信小程序项目专用规则
 */
module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true
  },
  globals: {
    wx: 'readonly',
    getApp: 'readonly',
    getCurrentPages: 'readonly',
    requestAnimationFrame: 'readonly',
    Page: 'readonly',
    Component: 'readonly',
    Image: 'readonly',
    __wxConfig: 'readonly',
    console: 'readonly'
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'comma-dangle': ['error', 'never'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'semi': ['error', 'always'],
    'arrow-spacing': ['error', { before: true, after: true }],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'max-len': ['warn', 120],
    'max-depth': ['warn', 4],
    'max-params': ['warn', 6],
    'no-multiple-empty-lines': ['warn', { max: 2, maxBOF: 0, maxEOF: 1 }],
    'keyword-spacing': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }]
  },
  overrides: [
    {
      files: ['cloudfunctions/**/*.js'],
      rules: {
        'max-len': ['warn', 150]
      }
    },
    {
      files: ['**/*.wxml', '**/*.wxss', '**/*.json'],
      parser: 'json'
    }
  ]
}
