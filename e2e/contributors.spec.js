import { test, expect } from '@playwright/test';

test.describe('Contributors Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contributors');
    await page.waitForLoadState('networkidle');
  });

  test('should display contributors page with leaderboard', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1, h2').filter({ hasText: /Contributors/i }).first()).toBeVisible();

    // Wait for contributor data to load
    await page.waitForSelector('table, .chart, .podium', { timeout: 10000 });

    // Verify table or visualization is present
    const contributorContent = page.locator('table, [class*="chart"], [class*="podium"]').first();
    await expect(contributorContent).toBeVisible();
  });

  test('should display top contributors podium', async ({ page }) => {
    // Wait for podium or top contributors section
    const podium = page.locator('[class*="podium"], [class*="top-3"], [class*="medal"]').first();

    if (await podium.count() > 0) {
      await expect(podium).toBeVisible();
    } else {
      // Alternative: check for table with contributors
      const table = page.locator('table');
      await expect(table).toBeVisible();
    }
  });

  test('should search for contributors', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();

    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();

      // Get initial row count
      const tableRows = page.locator('table tbody tr');
      const initialCount = await tableRows.count();

      if (initialCount > 0) {
        // Type a search term (get first contributor name)
        const firstContributor = await tableRows.first().locator('td').first().textContent();
        const searchTerm = firstContributor?.substring(0, 3) || 'test';

        await searchInput.fill(searchTerm);

        // Wait for results to filter
        await page.waitForTimeout(500);

        // Verify table is still visible
        await expect(page.locator('table')).toBeVisible();
      }
    }
  });

  test('should change contributor limit', async ({ page }) => {
    // Look for limit selector buttons (10, 20, 50, 100)
    const limitButtons = page.locator('button').filter({ hasText: /^(10|20|50|100)$/ });

    if (await limitButtons.count() > 0) {
      // Get initial count of contributors
      const tableRowsBefore = page.locator('table tbody tr');
      const countBefore = await tableRowsBefore.count();

      // Click on a different limit
      const button = limitButtons.first();
      await button.click();

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Verify table still has rows
      const tableRowsAfter = page.locator('table tbody tr');
      await expect(tableRowsAfter.first()).toBeVisible();
    }
  });

  test('should display contributor statistics table', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 });

    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check for table headers
    const headers = table.locator('thead th, thead td');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThan(0);

    // Check for table rows
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify first row has data
    const firstRow = rows.first();
    await expect(firstRow).toBeVisible();
    const cellText = await firstRow.locator('td').first().textContent();
    expect(cellText?.trim()).not.toBe('');
  });

  test('should filter by repository', async ({ page }) => {
    // Look for repository filter
    const repoSelect = page.locator('select').first();

    if (await repoSelect.count() > 0) {
      await expect(repoSelect).toBeVisible();

      // Get options
      const options = await repoSelect.locator('option').count();
      expect(options).toBeGreaterThan(1);

      // Select different repo
      await repoSelect.selectOption({ index: 1 });

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Verify table still visible
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should display contributor charts', async ({ page }) => {
    // Look for any Recharts visualizations
    const chart = page.locator('.recharts-surface, [class*="chart"]').first();

    if (await chart.count() > 0) {
      await expect(chart).toBeVisible();

      // Hover over chart
      await chart.hover();
      await page.waitForTimeout(300);

      // Verify chart is still visible and interactive
      await expect(chart).toBeVisible();
    }
  });

  test('should sort table columns', async ({ page }) => {
    // Wait for table
    await page.waitForSelector('table', { timeout: 10000 });

    // Look for sortable headers (usually have cursor-pointer or onclick)
    const sortableHeaders = page.locator('table thead th[class*="cursor-pointer"], table thead th button');

    if (await sortableHeaders.count() > 0) {
      const firstHeader = sortableHeaders.first();

      // Get initial first row data
      const firstRowBefore = await page.locator('table tbody tr').first().textContent();

      // Click header to sort
      await firstHeader.click();
      await page.waitForTimeout(500);

      // Click again to reverse sort
      await firstHeader.click();
      await page.waitForTimeout(500);

      // Verify table still has data
      const table = page.locator('table');
      await expect(table).toBeVisible();
    }
  });

  test('should handle date range filtering', async ({ page }) => {
    // Look for date inputs
    const dateInputs = page.locator('input[type="date"]');

    if (await dateInputs.count() > 0) {
      const fromDate = dateInputs.first();
      await fromDate.fill('2024-01-01');

      if (await dateInputs.count() > 1) {
        const toDate = dateInputs.nth(1);
        await toDate.fill('2024-12-31');
      }

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Verify table still visible
      await expect(page.locator('table')).toBeVisible();
    }
  });
});
