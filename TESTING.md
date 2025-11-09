# Testing Guide

Complete guide for testing the Metric Mind Dashboard application.

## Quick Start

### Unit Tests (Vitest)
```bash
npm run test              # Run once
npm run test:watch        # Watch mode (recommended for development)
npm run test:coverage     # With coverage report
npm run test:ui          # Interactive UI mode
```

### E2E Tests (Playwright)
```bash
# Terminal 1: Start dev environment (both backend + frontend)
npm run dev

# Terminal 2: Run E2E tests (wait ~5 seconds for servers to start)
npm run test:e2e          # Headless mode
npm run test:e2e:headed   # See browser in action
npm run test:e2e:ui       # Interactive debugger
```

**Important:** E2E tests require both the backend (port 3000) and frontend (port 5173) to be running.

## Test Status

### Unit Tests
✅ **48 tests passing**
- 20 tests: Date formatting utilities
- 16 tests: API client functions
- 12 tests: StatCard component

### E2E Tests
✅ **20 tests passing**
- 5 tests: Overview page (navigation, dark mode, mobile)
- 6 tests: Trends page (charts, filtering, interactions)
- 9 tests: Contributors page (search, sorting, date filtering)

## Testing Stack

### Unit & Component Testing
- **Vitest** - Fast unit test framework built for Vite
- **React Testing Library** - Test React components from a user's perspective
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **Happy DOM** - Lightweight DOM for fast test execution

### End-to-End Testing
- **Playwright** - Modern E2E testing with real browser automation
- **Multi-browser support** - Chromium, Firefox, WebKit
- **Mobile testing** - iPhone and Android viewports

## Project Structure

```
MetricMindDashboard/
├── client/src/
│   ├── components/
│   │   ├── StatCard.jsx
│   │   └── StatCard.test.jsx        # Component tests
│   ├── utils/
│   │   ├── dateFormat.js
│   │   ├── dateFormat.test.js       # Utility tests
│   │   └── api.test.js              # API tests
│   └── test/
│       ├── setup.js                 # Test configuration
│       └── testUtils.jsx            # Shared test utilities
├── e2e/
│   ├── overview.spec.js             # E2E: Overview page
│   ├── trends.spec.js               # E2E: Trends page
│   └── contributors.spec.js         # E2E: Contributors page
├── playwright.config.js             # Playwright configuration
└── vite.config.js                   # Vitest configuration
```

## Writing Unit Tests

### Testing Utilities

```javascript
import { describe, it, expect } from 'vitest';
import { formatDate } from './dateFormat';

describe('formatDate', () => {
  it('should format Date object to dd/mm/yyyy', () => {
    const date = new Date('2024-12-25');
    expect(formatDate(date)).toBe('25/12/2024');
  });

  it('should handle invalid dates', () => {
    expect(formatDate('invalid')).toBe('');
  });
});
```

### Testing Components

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

// Mock dependencies
vi.mock('react-countup', () => ({
  default: ({ end, suffix }) => <span>{end}{suffix}</span>,
}));

describe('StatCard', () => {
  it('should render title and value', () => {
    render(<StatCard title="Total Commits" value={1234} icon="📊" />);

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('should show change indicator', () => {
    render(<StatCard title="Test" value={100} change={15} icon="📈" />);

    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText(/15% from last period/)).toBeInTheDocument();
  });
});
```

### Testing API Functions

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing API
const mockGet = vi.fn();
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ get: mockGet })),
  },
}));

import { fetchRepos } from './api';

describe('API functions', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('should fetch repositories', async () => {
    const mockData = { data: [{ id: 1, name: 'test-repo' }] };
    mockGet.mockResolvedValue(mockData);

    const result = await fetchRepos();

    expect(mockGet).toHaveBeenCalledWith('/repos');
    expect(result).toEqual(mockData);
  });
});
```

## Writing E2E Tests

### Basic Page Test

```javascript
import { test, expect } from '@playwright/test';

test.describe('Overview Page', () => {
  test('should load and display data', async ({ page }) => {
    await page.goto('/');

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Metric Mind');

    // Wait for data
    await page.waitForSelector('.stat-card', { timeout: 10000 });

    // Verify stat cards
    const statCards = page.locator('.stat-card');
    expect(await statCards.count()).toBeGreaterThan(0);
  });
});
```

### Testing Interactions

```javascript
test('should filter by repository', async ({ page }) => {
  await page.goto('/trends');

  // Select repository
  await page.selectOption('select', { index: 1 });

  // Wait for chart to update
  await page.waitForTimeout(1000);

  // Verify chart still visible
  await expect(page.locator('.recharts-surface')).toBeVisible();
});
```

### Mobile Testing

```javascript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  // Find mobile menu button
  const menuButton = page.locator('button[aria-label="Toggle menu"]');
  await expect(menuButton).toBeVisible();

  // Open menu
  await menuButton.click();

  // Verify navigation visible
  await expect(page.locator('nav a').filter({ hasText: 'Overview' })).toBeVisible();
});
```

## Best Practices

### Use Semantic Selectors

```javascript
// ✅ Good - Stable and meaningful
page.locator('[data-testid="submit-button"]')
page.locator('button[aria-label="Close"]')
page.getByRole('button', { name: 'Submit' })

// ❌ Bad - Fragile
page.locator('.css-xyz-123')
page.locator('div > div > button')
```

### Add Test IDs to Components

```jsx
// In your component
<div className="stat-card" data-testid="stat-card">
  <h3 data-testid="stat-title">{title}</h3>
  <p data-testid="stat-value">{value}</p>
</div>

// In tests
await expect(page.locator('[data-testid="stat-card"]')).toBeVisible();
```

### Wait for Elements Properly

```javascript
// ✅ Good - Explicit wait
await page.waitForSelector('[data-testid="results"]');
await expect(page.locator('.data-table')).toBeVisible();

// ❌ Bad - Arbitrary timeout
await page.waitForTimeout(3000);
```

### Use Flexible Assertions

```javascript
// ✅ Good - Accommodates changes
expect(count).toBeGreaterThan(0);
await expect(element).toBeVisible();

// ❌ Bad - Brittle
await expect(cards).toHaveCount(5); // Breaks if count changes
```

## Test Coverage

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open client/coverage/index.html
```

### Coverage Goals

- **Utilities**: 90%+ coverage (critical functions)
- **Components**: 80%+ coverage
- **User workflows**: 100% E2E coverage (critical paths)

### Current Coverage

```
✅ dateFormat utilities: 100%
✅ API client: 100%
✅ StatCard component: 95%
✅ Critical user workflows: 100% E2E
```

## Troubleshooting

### Unit Tests

#### Issue: Tests fail with "not in document"
**Solution:** Add proper waits for async data
```javascript
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

#### Issue: Mock not working
**Solution:** Mock BEFORE importing
```javascript
vi.mock('axios'); // Must come before import
import { fetchRepos } from './api';
```

### E2E Tests

#### Issue: Tests timeout
**Solution:** Check if dev server is running
```bash
# Make sure this is running first
npm run dev
```

#### Issue: Element not found
**Solution:** Inspect actual UI and use correct selectors
```javascript
// Check what's actually in the DOM
// Use browser DevTools or Playwright Inspector
npx playwright test --debug
```

#### Issue: Backend connection refused
**Solution:** Ensure both backend and frontend are running
```bash
# Use npm run dev which starts both:
# - Backend on port 3000
# - Frontend on port 5173
```

### Common Fixes

**Tests fail randomly:**
- Add explicit waits: `await page.waitForSelector()`
- Increase timeout in flaky tests: `test.setTimeout(60000)`

**E2E tests can't find elements:**
- Use Playwright Inspector: `npx playwright test --debug`
- Check actual class names in DevTools
- Add `data-testid` attributes for stable selectors

**Coverage not accurate:**
- Files must end with `.test.js`, `.test.jsx`, `.spec.js`, or `.spec.jsx`
- Check `vite.config.js` coverage exclusions

## Debugging

### Debug Vitest Tests

```bash
# Interactive UI mode
npm run test:ui

# Add debugger in code
it('test name', () => {
  debugger; // Will pause here
  // test code
});
```

### Debug Playwright Tests

```bash
# Run with headed browser
npm run test:e2e:headed

# Use Playwright Inspector (step through tests)
npx playwright test --debug

# Run specific test
npx playwright test e2e/overview.spec.js

# Run tests matching pattern
npx playwright test -g "should display"
```

### View Test Artifacts

```bash
# Screenshots and videos on failure
open test-results/

# Playwright HTML report
npm run test:e2e:report
```

## CI/CD Integration

### GitHub Actions Example

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

      - name: Install dependencies
        run: |
          npm install
          cd client && npm install

      - name: Run unit tests
        run: npm run test:coverage

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: |
          npm run dev &
          sleep 10
          npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Common Commands Reference

### Unit Tests
```bash
npm run test                    # Run once
npm run test:watch              # Watch mode
npm run test:coverage           # With coverage
npm run test:ui                 # Interactive UI
npm run test -- dateFormat      # Run specific file
npm run test -- --grep "format" # Run matching tests
```

### E2E Tests
```bash
npm run test:e2e                        # Run all (headless)
npm run test:e2e:headed                 # See browser
npm run test:e2e:ui                     # Interactive debugger
npm run test:e2e:report                 # View last report
npx playwright test e2e/overview.spec.js  # Specific file
npx playwright test -g "should load"    # Matching tests
npx playwright test --debug             # Step through
npx playwright codegen http://localhost:5173  # Generate tests
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Questions?** The testing framework is fully configured and working. All 68 tests (48 unit + 20 E2E) are passing. Happy testing! 🎉
