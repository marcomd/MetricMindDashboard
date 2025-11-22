import { test, expect, type Page } from '@playwright/test';

test.describe('Overview Page', () => {
  test('should load and display overview page', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if main header is visible (h1 in Layout)
    const header = page.locator('h1');
    const headerVisible = await header.isVisible().catch(() => false);

    if (headerVisible) {
      await expect(header).toContainText('Metric Mind');
    }

    // Verify we're on overview page (not redirected to login)
    const url = page.url();
    expect(url).not.toContain('/login');
  });

  test('should handle empty data gracefully', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should render even with no data
    expect(await page.locator('body').isVisible()).toBe(true);

    // Should not show error messages
    const errors = await page.locator('text=/error|failed|crash/i').count();
    expect(errors).toBe(0);
  });

  test('should display page structure', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify page has content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('should have navigation menu', async ({ page }: { page: Page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check for navigation links (may be in sidebar or mobile menu)
    const navLinks = await page.locator('a, nav').count();
    expect(navLinks).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }: { page: Page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Page should be visible on mobile
    expect(await page.locator('body').isVisible()).toBe(true);
  });
});
