# E2E Testing Guide

## Running E2E Tests

E2E tests require the development server to run with authentication bypassed.

### Steps:

1. **Start the dev server in E2E test mode:**
   ```bash
   npm run dev:e2e
   ```
   This starts both the backend (with `E2E_TEST=true`) and frontend (with `VITE_E2E_TEST=true`), which bypasses Google OAuth authentication for testing.

2. **In another terminal, run the E2E tests:**
   ```bash
   npm run test:e2e
   ```

### What happens in E2E mode:

- **Backend**: The `requireAuth` middleware in `server/middleware/auth.ts` bypasses JWT verification and injects a mock test user
- **Frontend**: The `AuthContext` in `client/src/contexts/AuthContext.tsx` skips the auth check API call and sets a mock authenticated user

### Available E2E test commands:

```bash
npm run test:e2e          # Run all E2E tests headlessly
npm run test:e2e:headed   # Run tests in headed mode (see browser)
npm run test:e2e:ui       # Run tests with Playwright UI
npm run test:e2e:report   # View test report
```

### Note for CI/CD:

In CI/CD environments, you'll need to:
1. Start the dev server with `E2E_TEST=true`
2. Wait for it to be ready
3. Run the Playwright tests
4. Stop the dev server

Example:
```bash
E2E_TEST=true npm run dev &
SERVER_PID=$!
sleep 10  # Wait for server to start
npm run test:e2e
kill $SERVER_PID
```
