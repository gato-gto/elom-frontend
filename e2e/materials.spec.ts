import { test, expect } from '@playwright/test'

test.describe('Materials Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
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

    // Login
    await page.goto('/login')
    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display materials list', async ({ page }) => {
    // Mock materials API
    await page.route('**/api/v1/materials/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            results: [
              {
                id: 1,
                name: 'Test Material 1',
                sku: 'MAT001',
                category_name: 'Category 1',
                default_unit_code: 'kg',
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              {
                id: 2,
                name: 'Test Material 2',
                sku: 'MAT002',
                category_name: 'Category 2',
                default_unit_code: 'm',
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            ]
          })
        })
      }
    })

    await page.goto('/materials')
    
    await expect(page.getByText('Test Material 1')).toBeVisible()
    await expect(page.getByText('Test Material 2')).toBeVisible()
    await expect(page.getByText('MAT001')).toBeVisible()
    await expect(page.getByText('MAT002')).toBeVisible()
  })

  test('should create new material', async ({ page }) => {
    // Mock categories and units
    await page.route('**/api/v1/material-categories/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            { id: 1, name: 'Category 1' },
            { id: 2, name: 'Category 2' }
          ]
        })
      })
    })

    await page.route('**/api/v1/units/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 3,
          results: [
            { id: 1, code: 'kg', name: 'Kilogram' },
            { id: 2, code: 'm', name: 'Meter' },
            { id: 3, code: 'pcs', name: 'Pieces' }
          ]
        })
      })
    })

    // Mock material creation
    await page.route('**/api/v1/materials/', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 3,
            name: 'New Material',
            sku: 'NEW001',
            category: 1,
            category_name: 'Category 1',
            default_unit: 1,
            default_unit_code: 'kg',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 0,
            results: []
          })
        })
      }
    })

    await page.goto('/materials')
    await page.getByRole('button', { name: 'Добавить материал' }).click()
    
    await expect(page).toHaveURL('/materials/new')
    
    // Fill form
    await page.getByLabel('Название').fill('New Material')
    await page.getByLabel('SKU').fill('NEW001')
    await page.getByLabel('Категория').selectOption('1')
    await page.getByLabel('Единица измерения').selectOption('1')
    
    // Submit form
    await page.getByRole('button', { name: 'Сохранить' }).click()
    
    // Should redirect to materials list
    await expect(page).toHaveURL('/materials')
    await expect(page.getByText('Материал создан успешно')).toBeVisible()
  })

  test('should edit existing material', async ({ page }) => {
    // Mock material data
    await page.route('**/api/v1/materials/1/', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            name: 'Test Material',
            sku: 'TEST001',
            category: 1,
            category_name: 'Category 1',
            default_unit: 1,
            default_unit_code: 'kg',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          })
        })
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            name: 'Updated Material',
            sku: 'TEST001',
            category: 1,
            category_name: 'Category 1',
            default_unit: 1,
            default_unit_code: 'kg',
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          })
        })
      }
    })

    await page.goto('/materials/1/edit')
    
    // Update name
    await page.getByLabel('Название').fill('Updated Material')
    
    // Submit form
    await page.getByRole('button', { name: 'Сохранить' }).click()
    
    // Should redirect to materials list
    await expect(page).toHaveURL('/materials')
    await expect(page.getByText('Материал обновлен успешно')).toBeVisible()
  })

  test('should upload material photo', async ({ page }) => {
    // Mock material data
    await page.route('**/api/v1/materials/1/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          name: 'Test Material',
          sku: 'TEST001',
          category_name: 'Category 1',
          default_unit_code: 'kg',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        })
      })
    })

    // Mock photo upload
    await page.route('**/api/v1/materials/1/upload-photo/', async route => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          photo_url: 'https://example.com/photo.jpg'
        })
      })
    })

    await page.goto('/materials/1/edit')
    
    // Upload photo
    const fileInput = page.getByLabel('Фото')
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    })
    
    // Submit form
    await page.getByRole('button', { name: 'Сохранить' }).click()
    
    await expect(page.getByText('Фото загружено успешно')).toBeVisible()
  })
})
