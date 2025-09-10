# GitHub Actions CI/CD

This directory contains GitHub Actions workflows for automated testing and deployment.

## Workflows

### `test.yml` - Test Suite

- **Triggers**: Push to `main`/`develop` branches, Pull Requests
- **Node versions**: 18.x, 20.x (matrix testing)
- **Steps**:
  1. Lint code with ESLint
  2. Run unit tests with coverage
  3. Run E2E tests with Playwright
  4. Upload coverage reports to Codecov
  5. Upload Playwright artifacts on failure

### Test Commands

```bash
# Run unit tests locally
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run e2e

# CI-optimized test run
npm run test:ci
```

## Coverage Reporting

- Coverage reports are automatically uploaded to Codecov
- HTML coverage reports are generated in `coverage/` directory
- Coverage includes all source files except test files and configs

## E2E Testing

- Playwright tests run after unit tests pass
- Tests run against a built version of the app
- Reports are uploaded as artifacts when tests fail

## Status Badges

Add these to your README.md:

```markdown
![Tests](https://github.com/YOUR_USERNAME/snapShark/workflows/Test%20Suite/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/snapShark/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/snapShark)
```
