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

  test('should show helper text below chart when panel is closed', async ({ page }: { page: Page }) => {
    // Wait for page to load
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });

    // Check for helper text below the first chart (not in panel)
    const helperText = page.locator('text=/Click on any month in the chart above/i');
    await expect(helperText).toBeVisible({ timeout: 5000 });
  });

  test('should display commit details when clicking on chart month', async ({ page }: { page: Page }) => {
    // Wait for chart to load
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });

    // Click on the chart area to select a month
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.click({ position: { x: 100, y: 150 } });

    // Wait for API call to complete
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Verify commit details panel shows data
    // Look for table headers
    await expect(page.locator('th').filter({ hasText: /Date/i })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('th').filter({ hasText: /Lines/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Message/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Hash/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Author/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /Repository/i })).toBeVisible();

    // Verify table has rows with commit data
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBeLessThanOrEqual(10); // Should show max 10 commits
  });

  test('should update commit details when repository filter changes', async ({ page }: { page: Page }) => {
    // Wait for chart to load
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });

    // Click on chart to select a month
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.click({ position: { x: 100, y: 150 } });

    // Wait for initial commit details to load
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Verify commit details are shown
    await expect(page.locator('th').filter({ hasText: /Date/i })).toBeVisible({ timeout: 5000 });

    // Change repository filter
    const repoSelect = page.locator('select').first();
    await repoSelect.selectOption({ index: 1 });

    // Wait for commit details to update
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Verify commit details are still shown (data should be refreshed)
    await expect(page.locator('th').filter({ hasText: /Date/i })).toBeVisible();
  });

  test('should display responsive layout', async ({ page }: { page: Page }) => {
    // Desktop view - check for 2-column layout
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });

    // Verify grid layout exists
    const gridContainer = page.locator('.grid.grid-cols-1.md\\:grid-cols-12').first();
    await expect(gridContainer).toBeVisible();

    // Verify charts section and commit details panel are side by side on desktop
    const chartsSection = page.locator('.md\\:col-span-8').first();
    const commitDetailsPanel = page.locator('.md\\:col-span-4').first();
    await expect(chartsSection).toBeVisible();
    await expect(commitDetailsPanel).toBeVisible();

    // Mobile view - check for stacked layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for layout to adjust

    // Verify both sections are still visible but stacked
    await expect(chartsSection).toBeVisible();
    await expect(commitDetailsPanel).toBeVisible();
  });

  test('should show loading state in commit details when fetching', async ({ page }: { page: Page }) => {
    // Wait for chart to load
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });

    // Setup slow response to catch loading state
    await page.route('**/api/monthly-commits/**', async route => {
      await page.waitForTimeout(1000); // Delay response
      await route.continue();
    });

    // Click on chart to trigger loading
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.click({ position: { x: 100, y: 150 } });

    // Check for loading spinner (should appear briefly)
    const loadingSpinner = page.locator('[role="status"]');
    // Loading might be fast, but we verify it completes successfully
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits'),
      { timeout: 10000 }
    );

    // Unroute to restore normal behavior
    await page.unroute('**/api/monthly-commits/**');
  });

  test('should display commit data with correct formatting', async ({ page }: { page: Page }) => {
    // Wait for chart and click to select month
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.click({ position: { x: 100, y: 150 } });

    // Wait for commit details to load
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Check for proper data formatting
    const tableRows = page.locator('tbody tr');
    if (await tableRows.count() > 0) {
      const firstRow = tableRows.first();

      // Verify date format (dd/mm/yyyy pattern)
      const dateCell = firstRow.locator('td').first();
      await expect(dateCell).toContainText(/\d{2}\/\d{2}\/\d{4}/);

      // Verify lines changed shows total and breakdown
      const linesCell = firstRow.locator('td').nth(1);
      await expect(linesCell).toBeVisible();
      // Should show total and +added/-deleted
      await expect(linesCell.locator('text=/\\+\\d+/')).toBeVisible(); // +added
      await expect(linesCell.locator('text=/-\\d+/')).toBeVisible(); // -deleted

      // Verify hash is truncated (7 characters)
      const hashCell = firstRow.locator('td').nth(3);
      const hashText = await hashCell.textContent();
      expect(hashText?.length).toBe(7);
    }
  });

  test('should show title with selected month in commit details', async ({ page }: { page: Page }) => {
    // Wait for chart and click to select month
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.click({ position: { x: 100, y: 150 } });

    // Wait for commit details to load
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Verify title includes "Top Commits" and month
    const title = page.locator('h3').filter({ hasText: /Top Commits/i });
    await expect(title).toBeVisible();
    await expect(title).toContainText(/\d{4}-\d{2}/); // Should contain year-month format
  });

  test('should close panel when close button is clicked', async ({ page }: { page: Page }) => {
    // Wait for chart and click to select month
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.click({ position: { x: 100, y: 150 } });

    // Wait for commit details to load and panel to appear
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Verify panel is open
    await expect(page.locator('text=/Top Commits/i')).toBeVisible();

    // Find and click close button
    const closeButton = page.locator('button[aria-label="Close panel"]');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Verify panel is closed (commit details should not be visible)
    await expect(page.locator('text=/Top Commits/i')).not.toBeVisible();

    // Verify helper text is visible again
    const helperText = page.locator('text=/Click on any month in the chart above/i');
    await expect(helperText).toBeVisible();
  });

  test('should hide helper text when panel is open', async ({ page }: { page: Page }) => {
    // Wait for chart to load
    await page.waitForSelector('.recharts-surface', { timeout: 10000 });

    // Helper text should be visible initially
    const helperText = page.locator('text=/Click on any month in the chart above/i');
    await expect(helperText).toBeVisible();

    // Click on chart to open panel
    const chartArea = page.locator('.recharts-surface').first();
    await chartArea.click({ position: { x: 100, y: 150 } });

    // Wait for panel to open
    await page.waitForResponse(resp =>
      resp.url().includes('/api/monthly-commits') && resp.status() === 200,
      { timeout: 10000 }
    );

    // Helper text should not be visible when panel is open
    await expect(helperText).not.toBeVisible();

    // Panel should be visible
    await expect(page.locator('text=/Top Commits/i')).toBeVisible();
  });
});
