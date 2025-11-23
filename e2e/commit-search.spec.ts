import { test, expect } from '@playwright/test';

test.describe('Commit Search Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('/auth/check', async route => {
      await route.fulfill({
        json: {
          authenticated: true,
          user: {
            email: 'test@example.com',
            name: 'Test User',
            domain: 'example.com',
            avatar_url: null
          }
        }
      });
    });

    // Mock repositories
    await page.route('/api/repos', async route => {
      await route.fulfill({
        json: [
          { id: 1, name: 'test-repo' }
        ]
      });
    });

    // Navigate to the commit search page
    await page.goto('/commits');
  });

  test('should display search filters and results table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Commit Search' })).toBeVisible();

    // Check for filters
    await expect(page.getByLabel('Repository')).toBeVisible();
    await expect(page.getByLabel('Author')).toBeVisible();
    await expect(page.getByLabel('From Date')).toBeVisible();
    await expect(page.getByLabel('To Date')).toBeVisible();
    await expect(page.getByLabel('Commit Hash')).toBeVisible();

    // Check for results table headers
    await expect(page.locator('th').filter({ hasText: /date/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /repository/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /author/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /message/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /weight/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /hash/i })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: /actions/i })).toBeVisible();
  });

  test('should search for commits', async ({ page }) => {
    // Mock search results
    await page.route('/api/commits*', async route => {
      await route.fulfill({
        json: [{
          hash: 'test-hash-123',
          subject: 'Test Commit',
          author_name: 'Test User',
          author_email: 'test@example.com',
          commit_date: new Date().toISOString(),
          repository_name: 'test-repo',
          weight: 100,
          ai_tools: '',
          lines_added: 10,
          lines_deleted: 5
        }]
      });
    });

    // Click search button
    await page.getByRole('button', { name: /search/i }).click();

    // Wait for results
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(rows.first()).toContainText('Test Commit');
  });

  test('should open edit modal for own commits', async ({ page }) => {
    // Mock search results with matching email
    await page.route('/api/commits*', async route => {
      await route.fulfill({
        json: [{
          hash: 'test-hash-123',
          subject: 'Test Commit',
          author_name: 'Test User',
          author_email: 'test@example.com', // Matches mocked user
          commit_date: new Date().toISOString(),
          repository_name: 'test-repo',
          weight: 100,
          ai_tools: '',
          lines_added: 10,
          lines_deleted: 5
        }]
      });
    });

    await page.getByRole('button', { name: /search/i }).click();

    // Click edit button
    const editButton = page.getByTitle('Edit Commit').first();
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Check modal content
    await expect(page.getByRole('heading', { name: 'Edit Commit' })).toBeVisible();
    await expect(page.getByLabel('Subject')).toHaveValue('Test Commit');
    await expect(page.getByLabel('Weight (0-100)')).toHaveValue('100');

    // Close modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Commit' })).not.toBeVisible();
  });
});
