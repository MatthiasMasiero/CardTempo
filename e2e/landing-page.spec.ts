import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page successfully', async ({ page }) => {
    // Check if the main heading is visible
    await expect(page.getByRole('heading', { name: /optimize your credit card payments/i })).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Check header navigation
    await expect(page.getByRole('link', { name: /calculator/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /blog/i })).toBeVisible();

    // Check How It Works button
    const howItWorksButton = page.getByRole('button', { name: /how it works/i }).first();
    await expect(howItWorksButton).toBeVisible();
  });

  test('should navigate to calculator when CTA is clicked', async ({ page }) => {
    // Click the main CTA button
    await page.getByRole('link', { name: /calculate my optimal strategy/i }).click();

    // Verify we're on the calculator page
    await expect(page).toHaveURL(/.*calculator/);
  });

  test('should display FAQ section', async ({ page }) => {
    // Scroll to FAQ section
    await page.getByRole('button', { name: /faq/i }).first().click();

    // Wait for scroll animation
    await page.waitForTimeout(1000);

    // Check if FAQ heading is visible
    await expect(page.getByRole('heading', { name: /frequently asked questions/i })).toBeVisible();
  });

  test('should have sign in button when not authenticated', async ({ page }) => {
    const signInButton = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInButton).toBeVisible();
  });

  test('should display stats section with animated counters', async ({ page }) => {
    // Check if stats section is visible
    await expect(page.getByText(/point score increase/i)).toBeVisible();
    await expect(page.getByText(/of your credit score is utilization/i)).toBeVisible();
    await expect(page.getByText(/or less to see results/i)).toBeVisible();
  });

  test('should have footer with privacy and terms links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer links
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if main heading is still visible
    await expect(page.getByRole('heading', { name: /optimize your credit card payments/i })).toBeVisible();

    // Check if CTA button is visible
    await expect(page.getByRole('link', { name: /calculate my optimal strategy/i })).toBeVisible();
  });

  test('should navigate to blog page', async ({ page }) => {
    await page.getByRole('link', { name: /blog/i }).first().click();
    await expect(page).toHaveURL(/.*blog/);
  });
});
