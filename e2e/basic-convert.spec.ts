import { test, expect } from '@playwright/test';

test.describe('Image Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main interface', async ({ page }) => {
    // Check if main elements are present
    await expect(
      page.getByRole('heading', { name: /convert.*resize images/i })
    ).toBeVisible();
    await expect(
      page.getByText(/drag and drop or click to select/i)
    ).toBeVisible();
    await expect(page.getByText(/settings/i)).toBeVisible();
  });

  test('should show privacy messaging', async ({ page }) => {
    await expect(page.getByText(/100% private/i)).toBeVisible();
    await expect(page.getByText(/no uploads/i)).toBeVisible();
  });

  test('should have format selection', async ({ page }) => {
    // Click on format select to open dropdown
    await page.getByRole('combobox').first().click();

    // Check if supported formats are available
    await expect(page.getByText('JPEG')).toBeVisible();
    await expect(page.getByText('PNG')).toBeVisible();
    await expect(page.getByText('WebP')).toBeVisible();
  });

  test('should show Pro features in settings', async ({ page }) => {
    // Look for Pro badges or indicators
    await expect(page.getByText(/pro/i)).toBeVisible();
  });

  test('should display pricing information', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByRole('heading', { name: /pricing/i })).toBeVisible();
    await expect(page.getByText(/free/i)).toBeVisible();
    await expect(page.getByText(/pro/i)).toBeVisible();
    await expect(page.getByText(/£3/)).toBeVisible();
  });

  test('should navigate to account page', async ({ page }) => {
    await page.goto('/account');

    await expect(page.getByRole('heading', { name: /account/i })).toBeVisible();
    await expect(page.getByText(/subscription/i)).toBeVisible();
  });

  // TODO: Add file upload test with actual image file
  // This would require setting up test fixtures
  test.skip('should process image file', async ({ page }) => {
    // This test would:
    // 1. Upload a test image file
    // 2. Change settings
    // 3. Click convert
    // 4. Verify processed image appears
    // 5. Test download functionality
  });
});
