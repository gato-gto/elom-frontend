import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Вход в систему')
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]')
    
    await expect(page.locator('.text-error')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="text"]', 'invaliduser')
    await page.fill('input[type="password"]', 'invalidpass')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('.alert-error')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/purchases')
    await expect(page.locator('h1')).toContainText('Закупки')
  })

  test('should redirect to specified route after login', async ({ page }) => {
    await page.goto('/login?redirect=%2Fmaterials')
    
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/materials')
  })

  test('should show loading state during login', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await expect(page.locator('button[type="submit"]')).toContainText('Вход...')
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]')
    const toggleButton = page.locator('button[aria-label="Показать пароль"]')
    
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    await toggleButton.click()
    
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await page.fill('input[type="text"]', 'admin')
    await page.press('input[type="text"]', 'Enter')
    
    await expect(page.locator('input[type="password"]')).toBeFocused()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/materials')
    
    await expect(page).toHaveURL('/login?redirect=%2Fmaterials')
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/purchases')
    
    // Logout
    await page.click('button[aria-label="Пользователь"]')
    await page.click('text=Выйти')
    
    await expect(page).toHaveURL('/login')
  })
})

