module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'cloudfunctions/**/*.js',
    '!cloudfunctions/**/node_modules/**',
    '!cloudfunctions/**/wx-server-sdk/**'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000,
  verbose: true
}
