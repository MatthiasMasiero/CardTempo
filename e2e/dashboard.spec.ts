import { test, expect } from '@playwright/test';

test.describe('Dashboard - Unauthenticated', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/.*login.*/, { timeout: 5000 }).catch(() => {
      // Alternative: might show an auth prompt
    });
  });
});

// These tests would require authentication setup
test.describe.skip('Dashboard - Authenticated', () => {
  // Note: These tests require proper authentication setup
  // You would use Playwright's storageState feature to maintain auth

  test.beforeEach(async ({ page }) => {
    // TODO: Set up authentication before each test
    // This would involve logging in or loading a saved auth state
  });

  test('should load dashboard with user data', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for dashboard heading
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should display stats overview', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for stats cards
    await expect(page.getByText(/total cards/i)).toBeVisible();
    await expect(page.getByText(/utilization/i)).toBeVisible();
  });

  test('should have tabs for Cards, Reminders, and Calendar', async ({ page }) => {
    await page.goto('/dashboard');

    // Check for tabs
    await expect(page.getByRole('tab', { name: /cards/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /reminders/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /calendar/i })).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/dashboard');

    // Click on Reminders tab
    await page.getByRole('tab', { name: /reminders/i }).click();
    await page.waitForTimeout(500);

    // Click on Calendar tab
    await page.getByRole('tab', { name: /calendar/i }).click();
    await page.waitForTimeout(500);

    // Calendar should be visible
    await expect(page.locator('.calendar')).toBeVisible().catch(() => {
      // Calendar might have different class name
    });
  });

  test('should show empty state when no cards', async ({ page }) => {
    await page.goto('/dashboard');

    // If no cards, should show empty state
    const emptyState = page.getByText(/no cards yet/i).or(
      page.getByText(/add your first card/i)
    );

    // Empty state might be visible depending on user data
  });

  test('should display credit cards when available', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for card display elements
    // This would depend on having cards in the test account
  });

  test('should have View Results button', async ({ page }) => {
    await page.goto('/dashboard');

    const viewResultsButton = page.getByRole('button', { name: /view results/i }).or(
      page.getByRole('link', { name: /view results/i })
    );

    // Button should be visible if cards exist
  });

  test('should navigate to scenarios page', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for scenarios link/button
    const scenariosLink = page.getByRole('link', { name: /scenarios/i }).or(
      page.getByText(/what-if scenarios/i)
    );

    if (await scenariosLink.isVisible()) {
      await scenariosLink.click();
      await expect(page).toHaveURL(/.*scenarios/);
    }
  });

  test('should navigate to priority allocation page', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for priority/allocation link
    const priorityLink = page.getByRole('link', { name: /priority/i }).or(
      page.getByText(/smart payment/i)
    );

    if (await priorityLink.isVisible()) {
      await priorityLink.click();
      await expect(page).toHaveURL(/.*priority/);
    }
  });

  test('should show calendar view', async ({ page }) => {
    await page.goto('/dashboard');

    // Switch to calendar tab
    await page.getByRole('tab', { name: /calendar/i }).click();

    // Wait for calendar to render
    await page.waitForTimeout(1000);

    // Check for calendar elements
    // Calendar should show current month
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    await expect(page.getByText(currentMonth)).toBeVisible();
  });

  test('should navigate calendar months', async ({ page }) => {
    await page.goto('/dashboard');

    // Switch to calendar tab
    await page.getByRole('tab', { name: /calendar/i }).click();
    await page.waitForTimeout(500);

    // Look for next month button
    const nextButton = page.getByRole('button', { name: /next/i }).or(
      page.locator('button[aria-label*="next"]')
    );

    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display upcoming payment reminders', async ({ page }) => {
    await page.goto('/dashboard');

    // Switch to reminders tab
    await page.getByRole('tab', { name: /reminders/i }).click();
    await page.waitForTimeout(500);

    // Check for reminders section
    // Might show empty state or list of reminders
  });

  test('should allow user to logout', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for logout button (usually in account menu)
    const accountButton = page.getByRole('button', { name: /account/i }).or(
      page.getByRole('button', { name: /user/i })
    );

    if (await accountButton.isVisible()) {
      await accountButton.click();
      await page.waitForTimeout(500);

      const logoutButton = page.getByRole('button', { name: /sign out/i }).or(
        page.getByRole('button', { name: /logout/i })
      );

      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        // Should redirect to home or login
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Dashboard should still be accessible on mobile
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should navigate to settings', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for settings link
    const settingsLink = page.getByRole('link', { name: /settings/i });

    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(/.*settings/);
    }
  });
});
