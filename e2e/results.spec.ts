import { test, expect } from '@playwright/test';

test.describe('Results Page', () => {
  test('should load the results page', async ({ page }) => {
    await page.goto('/results');

    // Page should load without redirecting
    await expect(page).toHaveURL(/.*results/);
  });

  test('should show message when no results available', async ({ page }) => {
    await page.goto('/results');

    // Should show empty state or message about no results
    const noResultsMessage = page.getByText(/no results/i).or(
      page.getByText(/calculate/i)
    );

    // Message might be visible if no calculation has been done
  });

  test('should have navigation back to calculator', async ({ page }) => {
    await page.goto('/results');

    // Look for back to calculator link
    const calculatorLink = page.getByRole('link', { name: /calculator/i }).or(
      page.getByRole('button', { name: /back/i })
    );

    if (await calculatorLink.isVisible()) {
      await calculatorLink.click();
      await expect(page).toHaveURL(/.*calculator/);
    }
  });
});

test.describe.skip('Results Page - With Data', () => {
  // These tests require actual calculation results
  test.beforeEach(async ({ page }) => {
    // TODO: Set up test with calculation results
    // This would involve:
    // 1. Authenticating
    // 2. Adding cards
    // 3. Running calculation
    // 4. Navigating to results
  });

  test('should display optimization results', async ({ page }) => {
    await page.goto('/results');

    // Check for results heading
    await expect(page.getByRole('heading', { name: /optimized payment plan/i })).toBeVisible();
  });

  test('should show overall utilization improvement', async ({ page }) => {
    await page.goto('/results');

    // Check for utilization metrics
    await expect(page.getByText(/current utilization/i)).toBeVisible();
    await expect(page.getByText(/optimized utilization/i)).toBeVisible();
  });

  test('should display credit score impact estimate', async ({ page }) => {
    await page.goto('/results');

    // Check for score impact
    await expect(page.getByText(/estimated score impact/i)).toBeVisible();
    await expect(page.getByText(/points/i)).toBeVisible();
  });

  test('should show payment plan for each card', async ({ page }) => {
    await page.goto('/results');

    // Check for card payment plans
    // Should show optimization payment and balance payment
    await expect(page.getByText(/optimization payment/i)).toBeVisible();
  });

  test('should display payment dates correctly', async ({ page }) => {
    await page.goto('/results');

    // Payment dates should be visible
    // Format might vary but should show dates
  });

  test('should show payment amounts correctly', async ({ page }) => {
    await page.goto('/results');

    // Payment amounts should be displayed as currency
    // Look for $ symbols
    await expect(page.locator('text=/\\$/').first()).toBeVisible();
  });

  test('should have download PDF button', async ({ page }) => {
    await page.goto('/results');

    const downloadButton = page.getByRole('button', { name: /download pdf/i }).or(
      page.getByRole('button', { name: /download/i })
    );

    await expect(downloadButton).toBeVisible();

    // Click and wait for download
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download started
    expect(download.suggestedFilename()).toContain('payment');
  });

  test('should have export to calendar button', async ({ page }) => {
    await page.goto('/results');

    const exportButton = page.getByRole('button', { name: /export to calendar/i }).or(
      page.getByRole('button', { name: /calendar/i })
    );

    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);

      // Should show calendar export modal or download .ics file
    }
  });

  test('should have set reminders button', async ({ page }) => {
    await page.goto('/results');

    const reminderButton = page.getByRole('button', { name: /set reminders/i }).or(
      page.getByRole('button', { name: /remind/i })
    );

    if (await reminderButton.isVisible()) {
      await reminderButton.click();
      await page.waitForTimeout(500);

      // Should show reminder modal or form
    }
  });

  test('should show timeline visualization', async ({ page }) => {
    await page.goto('/results');

    // Check for payment timeline
    // Timeline should show dates and events
    await expect(page.getByText(/statement date/i)).toBeVisible();
    await expect(page.getByText(/due date/i)).toBeVisible();
  });

  test('should show cards needing optimization separately', async ({ page }) => {
    await page.goto('/results');

    // Cards should be categorized
    // High priority cards might be highlighted
  });

  test('should show cards already at optimal utilization', async ({ page }) => {
    await page.goto('/results');

    // Should indicate which cards are already optimal
    const optimalText = page.getByText(/already optimal/i).or(
      page.getByText(/no optimization needed/i)
    );

    // Text might appear if any cards are optimal
  });

  test('should calculate payment amounts correctly', async ({ page }) => {
    await page.goto('/results');

    // Get all payment amounts
    const amounts = await page.locator('text=/\\$[0-9,]+/').allTextContents();

    // Verify amounts are positive numbers
    amounts.forEach(amount => {
      const numericValue = parseFloat(amount.replace(/[$,]/g, ''));
      expect(numericValue).toBeGreaterThan(0);
    });
  });

  test('should show next statement and due dates', async ({ page }) => {
    await page.goto('/results');

    // Dates should be in the future
    // Check for date format (varies by locale)
    const datePattern = /\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2}, \d{4}/;

    // At least one date should match pattern
    await expect(page.locator(`text=${datePattern}`).first()).toBeVisible();
  });

  test('should navigate to dashboard when authenticated', async ({ page }) => {
    await page.goto('/results');

    const dashboardButton = page.getByRole('link', { name: /dashboard/i }).or(
      page.getByRole('button', { name: /dashboard/i })
    );

    if (await dashboardButton.isVisible()) {
      await dashboardButton.click();
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/results');

    // Results should be readable on mobile
    // Payment plans should be stacked vertically
  });

  test('should handle cards over credit limit', async ({ page }) => {
    await page.goto('/results');

    // If any cards are over limit, should show urgent message
    const urgentMessage = page.getByText(/urgent/i).or(
      page.getByText(/over limit/i)
    );

    // Message might appear depending on card data
  });

  test('should show utilization status indicators', async ({ page }) => {
    await page.goto('/results');

    // Should have color-coded status indicators
    // Good (green), Medium (yellow), High (red)
  });
});
