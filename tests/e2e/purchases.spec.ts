import { test, expect } from '@playwright/test'

test.describe('Purchases Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/purchases')
  })

  test('should display purchases list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Закупки')
    await expect(page.locator('table')).toBeVisible()
  })

  test('should create new purchase', async ({ page }) => {
    await page.click('button:has-text("Создать закупку")')
    
    await expect(page.locator('h2')).toContainText('Новая закупка')
    
    // Fill form
    await page.fill('input[name="date"]', '2024-01-01')
    await page.selectOption('select[name="object"]', '1')
    await page.selectOption('select[name="supplier"]', '1')
    await page.selectOption('select[name="responsible"]', '1')
    await page.selectOption('select[name="status"]', 'new')
    
    // Add item
    await page.click('button:has-text("Добавить позицию")')
    await page.selectOption('select[name="material"]', '1')
    await page.fill('input[name="quantity"]', '10')
    
    // Submit
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/purchases')
    await expect(page.locator('.alert-success')).toBeVisible()
  })

  test('should edit existing purchase', async ({ page }) => {
    // Click on first purchase row
    await page.click('tbody tr:first-child')
    
    await expect(page.locator('h2')).toContainText('Редактировать закупку')
    
    // Update form
    await page.fill('input[name="comment"]', 'Updated comment')
    
    // Submit
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/purchases')
    await expect(page.locator('.alert-success')).toBeVisible()
  })

  test('should delete purchase', async ({ page }) => {
    // Click on first purchase row
    await page.click('tbody tr:first-child')
    
    // Click delete button
    await page.click('button:has-text("Удалить")')
    
    // Confirm deletion
    await page.click('button:has-text("Да, удалить")')
    
    await expect(page).toHaveURL('/purchases')
    await expect(page.locator('.alert-success')).toBeVisible()
  })

  test('should filter purchases by status', async ({ page }) => {
    await page.selectOption('select[name="status"]', 'new')
    
    await expect(page.locator('tbody tr')).toHaveCount(1)
  })

  test('should search purchases', async ({ page }) => {
    await page.fill('input[placeholder*="Поиск"]', 'P0001')
    
    await expect(page.locator('tbody tr')).toHaveCount(1)
  })

  test('should export purchases to Excel', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')
    
    await page.click('button:has-text("Экспорт")')
    await page.click('button:has-text("Excel")')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('should upload photo to purchase', async ({ page }) => {
    // Click on first purchase row
    await page.click('tbody tr:first-child')
    
    // Upload photo
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg')
    
    await page.click('button:has-text("Загрузить фото")')
    
    await expect(page.locator('.alert-success')).toBeVisible()
  })

  test('should change purchase status', async ({ page }) => {
    // Click on first purchase row
    await page.click('tbody tr:first-child')
    
    // Change status
    await page.selectOption('select[name="status"]', 'completed')
    
    // Submit
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/purchases')
    await expect(page.locator('.alert-success')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Создать закупку")')
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]')
    
    await expect(page.locator('.text-error')).toBeVisible()
  })

  test('should handle pagination', async ({ page }) => {
    // Navigate to next page if available
    const nextButton = page.locator('button:has-text("Следующая")')
    if (await nextButton.isEnabled()) {
      await nextButton.click()
      await expect(page.locator('tbody tr')).toBeVisible()
    }
  })

  test('should handle bulk operations', async ({ page }) => {
    // Select multiple purchases
    await page.check('tbody tr:first-child input[type="checkbox"]')
    await page.check('tbody tr:nth-child(2) input[type="checkbox"]')
    
    // Perform bulk action
    await page.click('button:has-text("Удалить выбранные")')
    await page.click('button:has-text("Да, удалить")')
    
    await expect(page.locator('.alert-success')).toBeVisible()
  })
})

