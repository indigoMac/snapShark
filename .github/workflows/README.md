# GitHub Actions CI/CD

This directory contains GitHub Actions workflows for automated testing and deployment.

## Workflows

### `test.yml` - Test Suite

- **Triggers**: Push to `main`/`develop` branches, Pull Requests
- **Node version**: 20.x (single, fast run)
- **Steps**:
  1. Lint code with ESLint
  2. Run comprehensive unit tests with coverage (122 tests)
  3. Build application to ensure deployability
  4. Upload coverage reports to Codecov

## Test Strategy

**Why Unit Tests Only?**

- ✅ **122 comprehensive unit tests** covering all image processing logic
- ✅ **96.51% code coverage** of core functionality
- ✅ **Fast, reliable, deterministic** - no flaky tests
- ✅ **Tests actual business logic** - format conversion, resizing, quality
- ❌ **No E2E tests** - they don't add value for image processing tools

### Test Commands

```bash
# Run unit tests locally (watch mode)
npm run test

# Run tests with coverage report
npm run test:coverage

# CI-optimized test run
npm run test:ci
```

## Coverage Reporting

- **96.51% coverage** automatically tracked
- Coverage reports uploaded to Codecov
- HTML coverage reports generated in `coverage/` directory
- Covers all image processing logic, formats, presets, and error handling

## What's Tested

- ✅ **Image Format Support** - JPEG, PNG, WebP, AVIF, HEIC validation
- ✅ **Canvas Operations** - Resizing, scaling, aspect ratio calculations
- ✅ **Quality & Compression** - Lossy/lossless formats, quality settings
- ✅ **File Processing** - Batch operations, filename generation
- ✅ **Preset Management** - Built-in presets, custom presets, Pro features
- ✅ **Error Scenarios** - Invalid inputs, browser compatibility, edge cases

## Status Badges

Add these to your README.md:

```markdown
![Tests](https://github.com/YOUR_USERNAME/snapShark/workflows/Test%20Suite/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/snapShark/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/snapShark)
```
