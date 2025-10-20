const nextJest = require('next/jest')
const createJestConfig = nextJest({dir: './'})
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {'^@/(.*)$': '<rootDir>/$1'},
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**'
  ],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  coverageThreshold: {
    global: {branches: 70, functions: 70, lines: 70, statements: 70}
  }
}
module.exports = createJestConfig(customJestConfig)
