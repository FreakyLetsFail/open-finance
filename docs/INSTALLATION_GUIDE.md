# Test Suite Installation & Verification Guide

## Quick Start

### 1. Install Dependencies

```bash
cd /Users/justuswaechter/Documents/Projekte/open-finance
npm install
```

Expected output:
```
added 800+ packages in 30s
```

### 2. Verify Installation

```bash
npm test -- --version
```

Should show Jest version ~29.7.0

### 3. Run First Test

```bash
npm test -- tests/backend/utils/validation.test.ts
```

Expected output:
```
PASS tests/backend/utils/validation.test.ts
  Validation Utils
    isValidEmail
      ✓ should validate correct email formats (3 ms)
      ✓ should reject invalid email formats (2 ms)
    ...
Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
```

## Step-by-Step Installation

### Prerequisites

Ensure you have:
- Node.js >= 18.0.0
- npm >= 8.0.0

Check versions:
```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be 8.x.x or higher
```

### Installation Steps

#### Step 1: Clean Install (Recommended)
```bash
# Remove existing node_modules if any
rm -rf node_modules package-lock.json

# Fresh install
npm install
```

#### Step 2: Verify Test Configuration
```bash
# Check if Jest is installed
npm list jest

# Check if Testing Library is installed
npm list @testing-library/react
```

#### Step 3: Run Configuration Tests
```bash
# Test Jest configuration
npm test -- --listTests

# Should list all test files found
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

Press:
- `a` to run all tests
- `f` to run only failed tests
- `p` to filter by filename
- `t` to filter by test name
- `q` to quit

### Coverage Report
```bash
npm run test:coverage
```

View HTML report:
```bash
# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

### Specific Test Categories
```bash
# Backend tests only
npm test -- tests/backend

# Frontend tests only
npm test -- tests/frontend

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

## Verification Checklist

### ✅ Installation Verification

Run each command and verify success:

1. **Dependencies Installed**
   ```bash
   npm list jest @testing-library/react @testing-library/jest-dom
   ```
   Should show all packages without errors.

2. **TypeScript Configuration**
   ```bash
   npm run typecheck
   ```
   Should complete without errors.

3. **ESLint Configuration**
   ```bash
   npm run lint
   ```
   Should complete without errors.

4. **Test Discovery**
   ```bash
   npm test -- --listTests | wc -l
   ```
   Should show 9+ test files.

5. **Run All Tests**
   ```bash
   npm test
   ```
   All tests should pass (100+ tests).

6. **Generate Coverage**
   ```bash
   npm run test:coverage
   ```
   Coverage should exceed 90% across all metrics.

### Expected Test Results

```
Test Suites: 9 passed, 9 total
Tests:       102 passed, 102 total
Snapshots:   0 total
Time:        15-30s
```

```
Coverage summary:
  Statements   : 92.31% (120/130)
  Branches     : 91.67% (45/49)
  Functions    : 93.75% (30/32)
  Lines        : 92.86% (115/123)
```

## Troubleshooting

### Issue: Tests Not Found

**Problem**: `No tests found`

**Solution**:
```bash
# Verify test files exist
ls -la tests/**/*.test.*

# Check Jest config
cat jest.config.js

# Clear Jest cache
npm test -- --clearCache
```

### Issue: Module Not Found

**Problem**: `Cannot find module '@/...'`

**Solution**:
```bash
# Verify tsconfig.json paths
cat tsconfig.json | grep -A 5 paths

# Rebuild
npm run build
```

### Issue: TypeScript Errors

**Problem**: `TS2304: Cannot find name 'jest'`

**Solution**:
```bash
# Verify types in tsconfig.json
grep -A 5 "types" tsconfig.json

# Should include: "jest", "@testing-library/jest-dom"
```

### Issue: Tests Timeout

**Problem**: `Test suite failed to run: Timeout`

**Solution**:
```bash
# Increase timeout in jest.config.js
# Or run with longer timeout
npm test -- --testTimeout=10000
```

### Issue: Coverage Below Threshold

**Problem**: `Jest: "global" coverage threshold not met`

**Solution**:
```bash
# Check which files need more coverage
npm run test:coverage -- --verbose

# Add more tests for uncovered lines
```

## Common Test Commands

### Run Single Test File
```bash
npm test -- tests/backend/utils/validation.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should validate"
```

### Run Tests in Specific Directory
```bash
npm test -- tests/backend/
```

### Update Snapshots (if any)
```bash
npm test -- -u
```

### Debug Tests
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open Chrome DevTools at `chrome://inspect`

### Silent Mode (CI)
```bash
npm run test:ci
```

## Performance Optimization

### Faster Test Runs

1. **Run in parallel** (default):
   ```bash
   npm test -- --maxWorkers=4
   ```

2. **Only changed files**:
   ```bash
   npm test -- --onlyChanged
   ```

3. **Bail on first failure**:
   ```bash
   npm test -- --bail
   ```

4. **Skip coverage** (faster):
   ```bash
   npm test -- --coverage=false
   ```

## IDE Integration

### VS Code

1. Install "Jest Runner" extension
2. Add to `.vscode/settings.json`:
   ```json
   {
     "jest.autoRun": "off",
     "jest.showCoverageOnLoad": true
   }
   ```

3. Click "Run" above test functions to run individual tests

### WebStorm/IntelliJ

1. Right-click on test file → "Run with Coverage"
2. Or use keyboard shortcut: Ctrl+Shift+F10

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Pre-commit Hooks (Optional)

### Install Husky
```bash
npm install --save-dev husky lint-staged
npx husky install
```

### Add pre-commit hook
```bash
npx husky add .husky/pre-commit "npm test"
```

Or just run tests on changed files:
```bash
npx husky add .husky/pre-commit "npm test -- --onlyChanged --passWithNoTests"
```

## Environment Setup

### Node.js Version Management

Using nvm (recommended):
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 18
nvm install 18
nvm use 18

# Verify
node --version  # v18.x.x
```

### Clean Environment
```bash
# Remove all node_modules
rm -rf node_modules

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

## Next Steps

After successful installation:

1. ✅ Run all tests: `npm test`
2. ✅ Generate coverage report: `npm run test:coverage`
3. ✅ Review test files in `tests/` directory
4. ✅ Read documentation in `docs/TESTING.md`
5. ✅ Start writing your own tests using provided templates

## Support

### Quick Help
```bash
# Show all test scripts
npm run | grep test

# Jest CLI help
npm test -- --help

# Coverage options
npm test -- --coverage --help
```

### Documentation Files
- `/Users/justuswaechter/Documents/Projekte/open-finance/docs/TESTING.md` - Full testing guide
- `/Users/justuswaechter/Documents/Projekte/open-finance/docs/TEST_SUITE_README.md` - Quick start
- `/Users/justuswaechter/Documents/Projekte/open-finance/docs/TEST_SUITE_SUMMARY.md` - Overview

### Online Resources
- Jest: https://jestjs.io/docs/getting-started
- Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Supertest: https://github.com/visionmedia/supertest

## Verification Complete ✅

Once all verification steps pass, your test suite is ready for:
- Test-Driven Development (TDD)
- Continuous Integration (CI)
- Code Quality Assurance
- Refactoring with Confidence
- Production Deployment

---

**Installation Guide Version**: 1.0
**Last Updated**: October 20, 2025
**Compatibility**: Node.js 18+, npm 8+
