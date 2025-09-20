import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Войти' }).click()
    
    await expect(page.getByText('Username is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('should handle invalid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('invalid-user')
    await page.getByLabel('Password').fill('invalid-password')
    await page.getByRole('button', { name: 'Войти' }).click()
    
    await expect(page.getByText('Invalid credentials')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Mock successful login
    await page.route('**/api/v1/auth/token/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'mock-access-token',
          refresh: 'mock-refresh-token'
        })
      })
    })

    // Mock user profile
    await page.route('**/api/v1/users/me/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: 'admin'
        })
      })
    })

    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Войти' }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.route('**/api/v1/auth/token/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'mock-access-token',
          refresh: 'mock-refresh-token'
        })
      })
    })

    await page.route('**/api/v1/users/me/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: 'admin'
        })
      })
    })

    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Войти' }).click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Then logout
    await page.getByRole('button', { name: /user menu/i }).click()
    await page.getByText('Выйти').click()
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})
