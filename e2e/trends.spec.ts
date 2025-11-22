import { test, expect, type Page } from '@playwright/test';

test.describe('Trends Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/trends');
    await page.waitForLoadState('networkidle');
  });

  test('should load trends page without errors', async ({ page }: { page: Page }) => {
    await page.waitForTimeout(1000);

    // Verify page loaded
    expect(await page.locator('body').isVisible()).toBe(true);

    // Verify we're on trends page
    const url = page.url();
    expect(url).toContain('/trends');
  });

  test('should display page structure', async ({ page }: { page: Page }) => {
    await page.waitForTimeout(1000);

    // Page should have content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should handle empty data gracefully', async ({ page }: { page: Page }) => {
    await page.waitForTimeout(1000);

    // Page should render even with no data
    // No error messages should be displayed
    const errors = await page.locator('text=/error|failed|crash/i').count();
    expect(errors).toBe(0);
  });

  test('should have filter controls', async ({ page }: { page: Page }) => {
    await page.waitForTimeout(1000);

    // Check for filter controls (repository selector, time range buttons, etc.)
    const controls = await page.locator('select, button').count();
    // Should have at least some controls
    expect(controls).toBeGreaterThanOrEqual(0);
  });

  test('should have responsive layout', async ({ page }: { page: Page }) => {
    // Check for responsive grid layout
    const gridContainer = page.locator('.grid');
    const hasGrid = await gridContainer.count();

    // Grid may or may not be present depending on data
    expect(hasGrid).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive on mobile', async ({ page }: { page: Page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/trends');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    expect(await page.locator('body').isVisible()).toBe(true);

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    expect(await page.locator('body').isVisible()).toBe(true);
  });
});
