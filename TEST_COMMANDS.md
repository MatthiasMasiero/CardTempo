# Quick Test Commands Reference

## 🚀 Most Common Commands

```bash
# Run all unit/component tests
npm test

# Run all E2E tests
npm run test:e2e

# Pre-deployment check (run before deploying!)
npm run test:pre-deploy
```

## 📝 Unit & Component Tests

```bash
# Run tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test calculator.test

# Run tests matching pattern
npm test -- --testNamePattern="validation"
```

## 🌐 E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with interactive UI mode (RECOMMENDED for debugging)
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Run only Chrome tests (faster)
npm run test:e2e:chromium

# View test report
npm run test:e2e:report

# Run specific E2E test
npx playwright test landing-page.spec.ts

# Debug specific test
npx playwright test calculator.spec.ts --debug
```

## 🔍 Debugging

```bash
# Watch mode for unit tests
npm run test:watch

# Playwright UI mode (best for E2E debugging)
npm run test:e2e:ui

# Playwright with browser visible
npm run test:e2e:headed

# Playwright debug mode
npx playwright test --debug

# Generate test code (records your actions)
npx playwright codegen http://localhost:3000
```

## 📊 Coverage & Reports

```bash
# Generate coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/lcov-report/index.html

# View Playwright test report
npm run test:e2e:report
```

## ✅ Pre-Deployment

```bash
# Full pre-deployment test suite
# Runs: lint → unit tests → build → E2E tests
npm run test:pre-deploy
```

**This command should pass before every deployment!**

## 🔧 Setup Commands

```bash
# Install all dependencies (including test tools)
npm install

# Install Playwright browsers
npx playwright install

# Update Playwright browsers
npx playwright install --force
```

## 💡 Pro Tips

### Running Specific Tests

```bash
# Single test file
npm test calculator.test.ts

# Tests matching pattern
npm test -- --testNamePattern="should validate"

# Only changed tests
npm test -- --onlyChanged

# Run one E2E test
npx playwright test landing-page.spec.ts
```

### Focus on One Test While Debugging

```typescript
// In your test file, add .only
test.only('focus on this test', () => {
  // ...
});

// Then run normally
npm test
```

### Skip Slow Tests

```typescript
// Mark test as slow (gets more time)
test('slow operation', async () => {
  test.slow();
  // ...
});

// Skip test temporarily
test.skip('not ready yet', () => {
  // ...
});
```

## 📈 Coverage Thresholds

Minimum required coverage: **70%**

Check your coverage:
```bash
npm run test:coverage
```

## 🆘 Common Issues

### "Cannot find module"

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Playwright browser not found"

```bash
npx playwright install
```

### "Port 3000 already in use"

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in playwright.config.ts
```

### Tests timing out

```bash
# Increase timeout for specific test
test('slow test', async () => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

## 🎯 When to Run What

| Situation | Command |
|-----------|---------|
| Working on feature | `npm run test:watch` |
| Before committing | `npm test` |
| Testing UI changes | `npm run test:e2e:ui` |
| Before PR/merge | `npm run test:all` |
| Before deployment | `npm run test:pre-deploy` |
| Debugging E2E | `npm run test:e2e:ui` |
| CI/CD pipeline | `npm run test:pre-deploy` |

## 📚 More Info

See [TESTING.md](./TESTING.md) for comprehensive testing documentation.

---

**Quick Start:** `npm test` → `npm run test:e2e` → deploy! 🚀
