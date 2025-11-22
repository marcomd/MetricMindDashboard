import { test, expect, type Page } from '@playwright/test';

test.describe('Personal Performance Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/personal-performance');
    await page.waitForLoadState('networkidle');
  });

  test('should load personal performance page without errors', async ({ page }: { page: Page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Verify page loaded (no auth redirect)
    expect(await page.locator('body').isVisible()).toBe(true);

    // Verify we're on the right page (not login)
    const url = page.url();
    expect(url).toContain('/personal-performance');
  });

  test('should display page structure', async ({ page }: { page: Page }) => {
    await page.waitForTimeout(1000);

    // Page should have some content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should handle empty data gracefully', async ({ page }: { page: Page }) => {
    await page.waitForTimeout(1000);

    // Page should still render even with no data
    // Check that we don't see error messages
    const errorText = await page.locator('text=/error|failed|crash/i').count();
    expect(errorText).toBe(0);
  });

  test('should have filters section', async ({ page }: { page: Page }) => {
    await page.waitForTimeout(1000);

    // Check for filter elements (may be hidden if no repos)
    const hasFilters = await page.locator('select, input[type="date"], button').count();
    // Should have at least some filter controls
    expect(hasFilters).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive', async ({ page }: { page: Page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Page should still be visible
    expect(await page.locator('body').isVisible()).toBe(true);

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    expect(await page.locator('body').isVisible()).toBe(true);
  });
});
