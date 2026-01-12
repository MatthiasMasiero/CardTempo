# Testing Guide - CardTempo

This document provides comprehensive information about the testing setup and how to run tests for the CardTempo application.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Quick Start](#quick-start)
- [Unit & Component Tests](#unit--component-tests)
- [End-to-End Tests](#end-to-end-tests)
- [Pre-Deployment Testing](#pre-deployment-testing)
- [Continuous Integration](#continuous-integration)
- [Writing Tests](#writing-tests)
- [Coverage Goals](#coverage-goals)
- [Troubleshooting](#troubleshooting)

## Overview

The CardTempo uses a comprehensive testing strategy with two main testing frameworks:

1. **Jest + React Testing Library** - Unit and component tests
2. **Playwright** - End-to-end (E2E) tests

### Test Coverage

Current test coverage includes:

- ✅ Calculator logic (interest calculations, payment schedules)
- ✅ Form validation
- ✅ Component rendering and interaction
- ✅ User flows (authentication, calculator, dashboard)
- ✅ Responsive design on multiple devices

## Test Types

### Unit Tests

Test individual functions and utilities in isolation.

**Location:** `src/lib/__tests__/`

**Example:** Calculator logic, utility functions, score impact calculations

### Component Tests

Test React components with user interactions.

**Location:** `src/components/__tests__/`

**Example:** Forms, buttons, inputs, validation

### Integration Tests

Test how multiple components work together.

**Location:** Mixed with component tests

**Example:** Form submission with validation

### E2E Tests

Test complete user flows from start to finish.

**Location:** `e2e/`

**Example:** User signup → Add cards → Calculate → View results

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
# Run unit/component tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Pre-Deployment Check

Run this before deploying to production:

```bash
npm run test:pre-deploy
```

This runs:
1. Linting
2. Unit/component tests with coverage
3. Production build
4. E2E tests on Chromium

## Unit & Component Tests

### Available Commands

```bash
# Run tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Configuration

**Config file:** `jest.config.js`

**Setup file:** `jest.setup.js`

### Running Specific Tests

```bash
# Run a specific test file
npm test calculator.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="validation"

# Run only changed tests
npm test -- --onlyChanged
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory.

**Open HTML report:**

```bash
open coverage/lcov-report/index.html
```

**Coverage Thresholds:**

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Example: Testing Calculator Logic

```typescript
// src/lib/__tests__/calculator.test.ts
import { calculateCardPaymentPlan } from '../calculator';

test('should calculate payment plan for 50% utilization', () => {
  const card = {
    id: 'test-1',
    nickname: 'Test Card',
    creditLimit: 10000,
    currentBalance: 5000,
    statementDate: 15,
    dueDate: 10,
  };

  const result = calculateCardPaymentPlan(card, 0.05);

  expect(result.needsOptimization).toBe(true);
  expect(result.currentUtilization).toBe(50);
  expect(result.payments).toHaveLength(2);
});
```

## End-to-End Tests

### Available Commands

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run only Chromium tests
npm run test:e2e:chromium

# Show test report
npm run test:e2e:report
```

### Test Configuration

**Config file:** `playwright.config.ts`

**Test directory:** `e2e/`

### Test Projects

Playwright runs tests across multiple browsers and devices:

- Desktop Chrome
- Desktop Firefox
- Desktop Safari
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Running Specific Tests

```bash
# Run a specific test file
npx playwright test landing-page.spec.ts

# Run tests matching a pattern
npx playwright test --grep "authentication"

# Run a specific project
npx playwright test --project=firefox
```

### Debugging E2E Tests

```bash
# Run with UI mode (best for debugging)
npm run test:e2e:ui

# Run with inspector
npx playwright test --debug

# Run specific test with debug
npx playwright test landing-page.spec.ts --debug
```

### Test Reports

After running E2E tests, view the HTML report:

```bash
npm run test:e2e:report
```

Reports include:
- Test results
- Screenshots on failure
- Video recordings on failure
- Execution traces

### Example: Testing Landing Page

```typescript
// e2e/landing-page.spec.ts
import { test, expect } from '@playwright/test';

test('should navigate to calculator', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /calculate/i }).click();
  await expect(page).toHaveURL(/.*calculator/);
});
```

## Pre-Deployment Testing

Before deploying to production, run the comprehensive pre-deployment test suite:

```bash
npm run test:pre-deploy
```

This command runs:

1. **ESLint** - Code quality checks
2. **Jest with Coverage** - Unit/component tests
3. **Next.js Build** - Ensures production build succeeds
4. **Playwright (Chromium)** - Core E2E tests

**Expected time:** 3-5 minutes

**When to run:**
- Before merging to main branch
- Before deploying to production
- After major changes

## Continuous Integration

### GitHub Actions Setup

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run unit tests
      run: npm run test:coverage

    - name: Install Playwright Browsers
      run: npx playwright install --with-deps

    - name: Build application
      run: npm run build

    - name: Run E2E tests
      run: npm run test:e2e:chromium

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Environment Variables for CI

Set these in your CI environment:

```bash
CI=true
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## Writing Tests

### Best Practices

#### Unit/Component Tests

1. **Test behavior, not implementation**

```typescript
// ❌ Bad - testing implementation details
expect(component.state.isOpen).toBe(true);

// ✅ Good - testing behavior
expect(screen.getByRole('dialog')).toBeVisible();
```

2. **Use user-centric queries**

```typescript
// Priority order:
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/enter email/i)
screen.getByText(/welcome/i)
```

3. **Test accessibility**

```typescript
test('should have proper labels', () => {
  render(<CreditCardForm />);
  expect(screen.getByLabelText(/card name/i)).toBeInTheDocument();
});
```

4. **Mock external dependencies**

```typescript
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));
```

#### E2E Tests

1. **Use page object patterns for complex flows**

```typescript
class LoginPage {
  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

2. **Wait for elements properly**

```typescript
// ❌ Bad - arbitrary timeout
await page.waitForTimeout(3000);

// ✅ Good - wait for specific element
await expect(page.getByRole('heading')).toBeVisible();
```

3. **Use descriptive test names**

```typescript
test('should show validation error when submitting empty form', async ({ page }) => {
  // ...
});
```

4. **Clean up test data**

```typescript
test.afterEach(async ({ page }) => {
  // Clean up any test data
  await clearTestData();
});
```

### File Naming Conventions

- Unit/Component tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`

### Test Organization

```
src/
├── lib/
│   ├── calculator.ts
│   └── __tests__/
│       └── calculator.test.ts
├── components/
│   ├── CreditCardForm.tsx
│   └── __tests__/
│       └── CreditCardForm.test.tsx
e2e/
├── landing-page.spec.ts
├── calculator.spec.ts
├── authentication.spec.ts
├── dashboard.spec.ts
└── results.spec.ts
```

## Coverage Goals

### Current Coverage

Check current coverage:

```bash
npm run test:coverage
```

### Target Coverage

| Metric | Target | Current |
|--------|--------|---------|
| Lines | 70% | TBD |
| Functions | 70% | TBD |
| Branches | 70% | TBD |
| Statements | 70% | TBD |

### Priority Areas

Focus on high coverage for:

1. **Calculator logic** - Core business logic (target: 90%+)
2. **Validation** - Form validation functions (target: 85%+)
3. **Utilities** - Helper functions (target: 80%+)
4. **Components** - UI components (target: 70%+)

## Troubleshooting

### Common Issues

#### Jest Tests Failing

**Issue:** Tests fail with "Cannot find module '@/...'"

**Solution:** Check `jest.config.js` has correct module mapper:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

**Issue:** "TextEncoder is not defined"

**Solution:** Add to `jest.setup.js`:

```javascript
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
```

#### Playwright Tests Failing

**Issue:** "Browser not found"

**Solution:** Install browsers:

```bash
npx playwright install
```

**Issue:** "Timeout exceeded"

**Solution:** Increase timeout in test or config:

```typescript
test.setTimeout(60000); // 60 seconds
```

**Issue:** Tests fail in CI but pass locally

**Solution:**
- Check environment variables
- Ensure dev server is running
- Review CI logs for specific errors

#### Component Tests Failing

**Issue:** "Not wrapped in act(...)"

**Solution:** Use `waitFor` for async updates:

```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

**Issue:** Radix UI components hard to test

**Solution:** Use Playwright for complex UI interactions:
- Select dropdowns
- Date pickers
- Modals
- Popovers

### Debug Tips

1. **Use screen.debug()**

```typescript
render(<Component />);
screen.debug(); // Prints current DOM
```

2. **Use test.only() to run single test**

```typescript
test.only('should focus on this test', () => {
  // ...
});
```

3. **Use Playwright trace viewer**

```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

4. **Use Playwright codegen**

```bash
npx playwright codegen http://localhost:3000
```

## Additional Resources

### Documentation

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Tools

- **Coverage Viewer:** `coverage/lcov-report/index.html`
- **Playwright Report:** Run `npm run test:e2e:report`
- **Playwright Trace Viewer:** `npx playwright show-trace trace.zip`
- **Playwright Inspector:** Run with `--debug` flag

### Getting Help

If you encounter issues:

1. Check this documentation
2. Review test examples in codebase
3. Check official documentation
4. Search GitHub issues
5. Ask the team

## Maintenance

### Updating Test Dependencies

```bash
# Update all testing dependencies
npm update @playwright/test @testing-library/react @testing-library/jest-dom

# Update Playwright browsers
npx playwright install
```

### Adding New Tests

When adding new features:

1. Write unit tests for new functions
2. Write component tests for new components
3. Add E2E tests for new user flows
4. Run full test suite before merging

### Test Review Checklist

- [ ] Tests are passing
- [ ] Coverage meets threshold
- [ ] Tests are meaningful (not just for coverage)
- [ ] Tests follow naming conventions
- [ ] No skipped tests without explanation
- [ ] E2E tests cover happy path and error cases
- [ ] Accessibility considerations included

---

**Last Updated:** 2025-12-29

For questions or suggestions about testing, please contact the development team.
