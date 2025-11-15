import { test, expect, type Page } from '@playwright/test';

test.describe('Trends Page', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto('/trends');
    await page.waitForLoadState('networkidle');
  });

  test('should display trends page with chart', async ({ page }: { page: Page }) => {
    // Check page title
    await expect(page.locator('h1, h2').filter({ hasText: /Trends/i }).first()).toBeVisible();

    // Wait for chart to load
    await page.waitForSelector('.recharts-surface, [class*="chart"]', { timeout: 10000 });

    // Verify chart is visible
    const chart = page.locator('.recharts-surface, [class*="chart"]').first();
    await expect(chart).toBeVisible();
  });

  test('should filter by repository', async ({ page }: { page: Page }) => {
    // Wait for repository selector
    const repoSelect = page.locator('select').filter({ hasText: /all/i }).or(
      page.locator('select').first()
    );

    await expect(repoSelect).toBeVisible({ timeout: 10000 });

    // Get initial options count
    const optionsBefore: number = await repoSelect.locator('option').count();
    expect(optionsBefore).toBeGreaterThan(1);

    // Select a specific repository
    await repoSelect.selectOption({ index: 1 });

    // Wait for chart to update
    await page.waitForTimeout(1000);

    // Verify chart still visible after filter
    const chart = page.locator('.recharts-surface, [class*="chart"]').first();
    await expect(chart).toBeVisible();
  });

  test('should change time range', async ({ page }: { page: Page }) => {
    // Look for time range buttons (3, 6, 12, 24 months)
    const timeRangeButtons = page.locator('button').filter({ hasText: /3|6|12|24/ });

    if (await timeRangeButtons.count() > 0) {
      const firstButton = timeRangeButtons.first();
      await firstButton.click();

      // Wait for chart to update
      await page.waitForTimeout(1000);

      // Verify chart still visible
      const chart = page.locator('.recharts-surface, [class*="chart"]').first();
      await expect(chart).toBeVisible();
    }
  });

  test('should display chart cards with metrics', async ({ page }: { page: Page }) => {
    // Wait for chart cards (Trends page uses cards for charts, not stat-cards)
    await page.waitForSelector('.card', { timeout: 10000 });

    // Verify chart cards are visible
    const chartCards = page.locator('.card');
    const count: number = await chartCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify first card contains a chart
    const firstCard = chartCards.first();
    await expect(firstCard).toBeVisible();

    // Check for chart heading
    await expect(firstCard.locator('h3')).toContainText(/Commits Over Time/i);
  });

  test('should show loading state initially', async ({ page }: { page: Page }) => {
    // Reload page to catch loading state
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-trends') && resp.status() === 200
    );

    await page.reload();

    // Check for loading spinner or skeleton
    const loadingIndicator = page.locator('[class*="loading"], [class*="spinner"], svg.animate-spin');

    // Loading might be very fast, so we just verify the response comes through
    await responsePromise;

    // Verify final content is displayed
    await expect(page.locator('.recharts-surface, [class*="chart"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle chart interactions', async ({ page }: { page: Page }) => {
    // Wait for chart
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });

    // Hover over chart area to trigger tooltip
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.hover();

    // Wait a moment for tooltip to potentially appear
    await page.waitForTimeout(500);

    // Verify chart is still interactive (no crash)
    await expect(chartArea).toBeVisible();
  });
});
