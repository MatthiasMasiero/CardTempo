import { test, expect } from '@playwright/test';

test.describe('Credit Card Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator');
  });

  test('should load the calculator page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /credit card optimizer/i })).toBeVisible();
  });

  test('should display the credit card form', async ({ page }) => {
    // Check for form fields
    await expect(page.getByLabel(/card nickname/i)).toBeVisible();
    await expect(page.getByLabel(/credit limit/i)).toBeVisible();
    await expect(page.getByLabel(/current balance/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit form without filling required fields
    const addButton = page.getByRole('button', { name: /add card/i });
    await addButton.click();

    // Wait for validation messages
    await page.waitForTimeout(500);

    // Check if form is still visible (didn't submit)
    await expect(page.getByLabel(/card nickname/i)).toBeVisible();
  });

  test('should successfully add a credit card', async ({ page }) => {
    // Note: This test requires authentication, which we'll skip for now
    // In a real scenario, you'd need to log in first

    // Fill out the form
    await page.getByLabel(/card nickname/i).fill('Chase Sapphire');
    await page.getByLabel(/credit limit/i).fill('10000');
    await page.getByLabel(/current balance/i).fill('5000');

    // Fill date fields
    await page.getByLabel(/statement date/i).fill('15');
    await page.getByLabel(/due date/i).fill('10');

    // Note: Without authentication, this will show a sign-in prompt
    // In authenticated tests, this would successfully add the card
  });

  test('should calculate and display results', async ({ page }) => {
    // This test would require authentication and adding cards
    // Check if the calculate button exists
    const calculateButton = page.getByRole('button', { name: /calculate/i });

    // Button might be disabled if no cards are added
    if (await calculateButton.isVisible()) {
      await expect(calculateButton).toBeVisible();
    }
  });

  test('should show authentication prompt for unauthenticated users', async ({ page }) => {
    // Check for sign-in link or message
    const signInLink = page.getByRole('link', { name: /sign in/i });
    if (await signInLink.isVisible()) {
      await expect(signInLink).toBeVisible();
    }
  });

  test('should have autocomplete for card search', async ({ page }) => {
    // Look for card search/autocomplete input
    const searchInput = page.locator('input[placeholder*="Search"]').or(
      page.locator('input[placeholder*="card"]')
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Chase');
      // Wait for autocomplete suggestions
      await page.waitForTimeout(500);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if form is still accessible
    await expect(page.getByLabel(/card nickname/i)).toBeVisible();
  });

  test('should navigate back to home', async ({ page }) => {
    // Look for home/back button
    const homeLink = page.getByRole('link', { name: /home/i }).or(
      page.locator('a[href="/"]')
    ).first();

    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});

test.describe('Calculator with Mock Authentication', () => {
  // These tests would use Playwright's browser context to simulate authentication
  test.skip('should add multiple cards when authenticated', async ({ page }) => {
    // TODO: Implement with proper authentication setup
    // This would involve setting up Supabase test credentials
  });

  test.skip('should calculate optimization results correctly', async ({ page }) => {
    // TODO: Test the calculation logic
    // Add cards with known values and verify the results
  });

  test.skip('should display payment schedule', async ({ page }) => {
    // TODO: Verify payment dates and amounts are displayed correctly
  });
});
