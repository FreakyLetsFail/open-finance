# Testing Documentation

## Overview

This project uses Jest and Testing Library to achieve comprehensive test coverage across backend and frontend components.

## Test Coverage Goals

- **Statements**: >90%
- **Branches**: >90%
- **Functions**: >90%
- **Lines**: >90%

## Test Structure

```
tests/
├── setup.ts                      # Global test configuration
├── __mocks__/                    # Mock implementations
│   └── fetch.ts
├── fixtures/                     # Test data
│   └── users.json
├── utils/                        # Test utilities
│   └── testHelpers.ts
├── backend/                      # Backend tests
│   ├── utils/
│   │   └── validation.test.ts    # Unit tests
│   ├── services/
│   │   └── userService.test.ts   # Unit tests
│   └── integration/
│       └── api.integration.test.ts  # Integration tests
├── frontend/                     # Frontend tests
│   ├── components/
│   │   ├── UserCard.test.tsx     # Unit tests
│   │   └── UserForm.test.tsx     # Unit tests
│   ├── hooks/
│   │   └── useUsers.test.ts      # Unit tests
│   └── integration/
│       └── userFlow.integration.test.tsx  # Integration tests
└── e2e/
    └── userManagement.e2e.test.ts   # E2E tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Test Categories
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# CI mode
npm run test:ci
```

## Test Types

### 1. Unit Tests

Test individual functions and components in isolation.

**Backend Example:**
```typescript
describe('isValidEmail', () => {
  it('should validate correct email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });
});
```

**Frontend Example:**
```typescript
describe('UserCard Component', () => {
  it('should render user information', () => {
    render(<UserCard name="John" email="john@example.com" />);
    expect(screen.getByTestId('user-name')).toHaveTextContent('John');
  });
});
```

### 2. Integration Tests

Test interactions between components and systems.

**API Integration:**
```typescript
describe('POST /api/users', () => {
  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(201);
  });
});
```

**Component Integration:**
```typescript
describe('User Management Flow', () => {
  it('should complete full user creation flow', async () => {
    // Test complete user journey through multiple components
  });
});
```

### 3. End-to-End Tests

Test complete user workflows with real server.

```typescript
describe('E2E: User Management', () => {
  it('should handle realistic user journey', async () => {
    // Registration -> Profile View -> Update -> Delete
  });
});
```

## Testing Utilities

### Test Helpers

```typescript
import { createMockUser, mockFetch, renderWithProviders } from 'tests/utils/testHelpers';

// Create mock data
const user = createMockUser({ name: 'Custom Name' });

// Mock API responses
mockFetch([user1, user2]);

// Render with context providers
renderWithProviders(<MyComponent />);
```

### Fixtures

Predefined test data in `tests/fixtures/users.json`:

```json
{
  "validUser": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "invalidUsers": [...]
}
```

## Writing Tests

### Best Practices

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should update user', async () => {
     // Arrange
     const user = await createUser();

     // Act
     const updated = await updateUser(user.id, { age: 30 });

     // Assert
     expect(updated.age).toBe(30);
   });
   ```

2. **Descriptive Test Names**
   ```typescript
   // Good
   it('should throw error when email is invalid')

   // Bad
   it('test validation')
   ```

3. **Test Edge Cases**
   - Boundary values (min/max)
   - Empty/null inputs
   - Concurrent operations
   - Error conditions

4. **Isolation**
   - Each test should be independent
   - Use `beforeEach` for setup
   - Clear mocks between tests

5. **Assertions**
   - Test one behavior per test
   - Use specific matchers
   - Check both success and error paths

## Coverage Reports

After running `npm run test:coverage`:

```
Coverage summary:
  Statements   : 92% (120/130)
  Branches     : 91% (45/49)
  Functions    : 94% (30/32)
  Lines        : 93% (115/123)
```

View detailed HTML report:
```bash
open coverage/lcov-report/index.html
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-commit hooks (optional)

CI configuration in `.github/workflows/test.yml`.

## Common Issues

### Mock Not Working
```typescript
// Ensure mocks are cleared
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Async Test Timeout
```typescript
// Increase timeout for slow tests
jest.setTimeout(10000);
```

### Component Not Found
```typescript
// Wait for async rendering
await waitFor(() => {
  expect(screen.getByTestId('element')).toBeInTheDocument();
});
```

## Performance Testing

### Benchmark Tests
```typescript
it('should process 1000 items under 100ms', async () => {
  const start = performance.now();
  await processItems(1000);
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100);
});
```

### Memory Testing
```typescript
it('should handle memory efficiently', () => {
  const before = process.memoryUsage().heapUsed;
  processLargeDataset();
  global.gc();
  const after = process.memoryUsage().heapUsed;
  expect(after - before).toBeLessThan(50 * 1024 * 1024);
});
```

## Security Testing

```typescript
it('should prevent XSS attacks', () => {
  const xss = '<script>alert("XSS")</script>';
  const sanitized = sanitizeInput(xss);
  expect(sanitized).not.toContain('<script>');
});

it('should prevent SQL injection', async () => {
  const malicious = "'; DROP TABLE users; --";
  // Should not crash or execute SQL
  await createUser({ name: malicious });
});
```

## Debugging Tests

### Run Single Test
```bash
npm test -- UserCard.test.tsx
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm run test:verbose
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
