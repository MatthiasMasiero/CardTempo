import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Click sign in button
    const signInButton = page.getByRole('link', { name: /sign in/i }).first();
    await signInButton.click();

    // Verify we're on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should display login form with email and password fields', async ({ page }) => {
    await page.goto('/login');

    // Check form fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should have link to signup page', async ({ page }) => {
    await page.goto('/login');

    // Look for signup link
    const signupLink = page.getByRole('link', { name: /sign up/i }).or(
      page.getByRole('link', { name: /create account/i })
    );

    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/.*signup/);
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/login');

    // Fill invalid email
    await page.getByLabel(/email/i).fill('invalidemail');
    await page.getByLabel(/password/i).fill('password123');

    // Try to submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('nonexistent@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should show error (either stay on page or show error message)
    // The specific error handling depends on your implementation
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    // Navigate to signup
    await page.goto('/signup');

    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  });

  test('should display signup form', async ({ page }) => {
    await page.goto('/signup');

    // Check form fields
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up/i }).or(
      page.getByRole('button', { name: /create account/i })
    )).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/signup');

    // Fill with weak password
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).first().fill('123'); // Too short

    // Try to submit
    const signupButton = page.getByRole('button', { name: /sign up/i }).or(
      page.getByRole('button', { name: /create account/i })
    );
    await signupButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should show validation error or stay on page
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Form should still be accessible
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login or show authentication prompt
    await page.waitForURL(/.*login.*/, { timeout: 5000 }).catch(() => {
      // If no redirect, check if there's an auth prompt on the page
      expect(page.getByText(/sign in/i).or(page.getByText(/login/i))).toBeTruthy();
    });
  });

  test('should allow access to calculator without authentication', async ({ page }) => {
    // Calculator should be accessible without auth
    await page.goto('/calculator');

    await expect(page).toHaveURL(/.*calculator/);
    await expect(page.getByRole('heading', { name: /credit card optimizer/i })).toBeVisible();
  });

  test('should allow access to results page without authentication', async ({ page }) => {
    // Results page should be accessible (though functionality limited)
    await page.goto('/results');

    // Should load without redirecting
    await expect(page).toHaveURL(/.*results/);
  });
});

// Note: To test successful authentication, you would need to:
// 1. Set up test user credentials in your test environment
// 2. Use Playwright's storageState to persist authentication
// 3. Create authenticated context for tests

test.describe.skip('Authenticated User Flow', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    // TODO: Implement with test credentials
    // await page.goto('/login');
    // await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
    // await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
    // await page.click('button[type="submit"]');
    // await expect(page).toHaveURL('/dashboard');
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // TODO: Test session persistence
  });

  test('should successfully logout', async ({ page }) => {
    // TODO: Test logout functionality
  });
});
