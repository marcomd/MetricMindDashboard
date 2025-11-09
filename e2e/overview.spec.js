import { test, expect } from '@playwright/test';

test.describe('Overview Page', () => {
  test('should load and display repository overview', async ({ page }) => {
    await page.goto('/');

    // Check if main header is visible (h1 in Layout)
    await expect(page.locator('h1')).toContainText('Metric Mind');

    // Check for page heading (h2 in Overview page)
    await expect(page.locator('h2').first()).toContainText(/Dashboard Overview/i);

    // Wait for data to load
    await page.waitForSelector('.stat-card', { timeout: 10000 });

    // Check for stat cards (4 cards: Total Repositories, Total Commits, Contributors, Active Repos)
    const statCards = page.locator('.stat-card');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(3); // At least 3 stat cards

    // Verify stat cards have values
    const firstCard = statCards.first();
    await expect(firstCard).toBeVisible();
  });

  test('should display repository cards', async ({ page }) => {
    await page.goto('/');

    // Wait for repository cards to load
    await page.waitForSelector('.card', { timeout: 10000 });

    // Check if repository cards are present
    const repoCards = page.locator('.card').filter({ hasText: /commits/i });
    const count = await repoCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/');

    // Test navigation to Trends
    await page.click('text=Trends');
    await expect(page).toHaveURL(/.*trends/);

    // Test navigation to Contributors
    await page.click('text=Contributors');
    await expect(page).toHaveURL(/.*contributors/);

    // Test navigation to Activity
    await page.click('text=Activity');
    await expect(page).toHaveURL(/.*activity/);

    // Test navigation back to Overview
    await page.click('text=Overview');
    await expect(page).toHaveURL(/.*\//);
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');

    // Find dark mode toggle button
    const darkModeToggle = page.locator('button').filter({ hasText: /☀|🌙/ });
    await expect(darkModeToggle).toBeVisible();

    // Get initial theme
    const htmlElement = page.locator('html');
    const initialTheme = await htmlElement.getAttribute('class');

    // Toggle dark mode
    await darkModeToggle.click();

    // Wait for theme to change
    await page.waitForTimeout(500);

    // Verify theme changed
    const newTheme = await htmlElement.getAttribute('class');
    expect(initialTheme).not.toBe(newTheme);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check if mobile menu button is visible (has aria-label="Toggle menu")
    const mobileMenuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(mobileMenuButton).toBeVisible();

    // Open mobile menu
    await mobileMenuButton.click();

    // Wait for mobile menu to appear
    await page.waitForTimeout(300); // Wait for animation

    // Verify navigation links are visible in mobile menu
    const overviewLink = page.locator('nav a').filter({ hasText: 'Overview' }).last();
    await expect(overviewLink).toBeVisible();
  });
});
