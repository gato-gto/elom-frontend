import { test, expect } from '@playwright/test'

test.describe('Tools Management', () => {
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
          username: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@example.com',
          role: 'admin'
        })
      })
    })

    // Login
    await page.goto('/login')
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display tools list', async ({ page }) => {
    // Mock tools API
    await page.route('**/api/v1/tools/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 3,
            results: [
              {
                id: 1,
                inventory_number: 'TOOL001',
                name: 'Перфоратор Makita HR2470',
                category: 'Перфоратор, SDS-Plus',
                brand: 'Makita',
                current_holder: null,
                current_holder_name: null,
                current_object: null,
                current_object_name: null,
                condition: 'good',
                condition_display: 'Хорошее',
                is_in_stock: true,
                status_display: 'На складе',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              {
                id: 2,
                inventory_number: 'TOOL002',
                name: 'Дрель Bosch GSB 13 RE',
                category: 'Дрель',
                brand: 'Bosch',
                current_holder: 2,
                current_holder_name: 'Иванов Иван',
                current_object: 1,
                current_object_name: 'ЖК Солнечный',
                condition: 'good',
                condition_display: 'Хорошее',
                is_in_stock: false,
                status_display: 'У Иванов Иван (объект: ЖК Солнечный)',
                created_at: '2024-01-02T00:00:00Z',
                updated_at: '2024-01-02T00:00:00Z'
              },
              {
                id: 3,
                inventory_number: 'TOOL003',
                name: 'Углошлифовальная машина DeWalt DWE4057',
                category: 'УШМ, Болгарка',
                brand: 'DeWalt',
                current_holder: null,
                current_holder_name: null,
                current_object: null,
                current_object_name: null,
                condition: 'needs_repair',
                condition_display: 'Требует ремонта',
                is_in_stock: true,
                status_display: 'На складе',
                created_at: '2024-01-03T00:00:00Z',
                updated_at: '2024-01-03T00:00:00Z'
              }
            ]
          })
        })
      }
    })

    // Mock employees API for filters
    await page.route('**/api/v1/employees/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            { id: 1, username: 'admin', first_name: 'Admin', last_name: 'User' },
            { id: 2, username: 'worker', first_name: 'Иванов', last_name: 'Иван' }
          ]
        })
      })
    })

    // Mock objects API for filters
    await page.route('**/api/v1/objects/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [
            { id: 1, name: 'ЖК Солнечный', location: 'г. Москва' }
          ]
        })
      })
    })

    await page.goto('/tools_index')
    
    // Check page title and content
    await expect(page.getByText('Инструменты')).toBeVisible()
    await expect(page.getByText('Учёт и управление инструментами')).toBeVisible()
    
    // Check tools are displayed
    await expect(page.getByText('TOOL001')).toBeVisible()
    await expect(page.getByText('Перфоратор Makita HR2470')).toBeVisible()
    await expect(page.getByText('TOOL002')).toBeVisible()
    await expect(page.getByText('Дрель Bosch GSB 13 RE')).toBeVisible()
    await expect(page.getByText('TOOL003')).toBeVisible()
    
    // Check status displays
    await expect(page.getByText('На складе')).toBeVisible()
    await expect(page.getByText('У Иванов Иван (объект: ЖК Солнечный)')).toBeVisible()
    
    // Check condition badges
    await expect(page.getByText('Хорошее')).toBeVisible()
    await expect(page.getByText('Требует ремонта')).toBeVisible()
  })

  test('should filter tools by condition', async ({ page }) => {
    // Mock filtered API response
    await page.route('**/api/v1/tools/?condition=good', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            {
              id: 1,
              inventory_number: 'TOOL001',
              name: 'Перфоратор Makita HR2470',
              category: 'Перфоратор, SDS-Plus',
              brand: 'Makita',
              condition: 'good',
              condition_display: 'Хорошее',
              is_in_stock: true,
              status_display: 'На складе'
            },
            {
              id: 2,
              inventory_number: 'TOOL002',
              name: 'Дрель Bosch GSB 13 RE',
              category: 'Дрель',
              brand: 'Bosch',
              condition: 'good',
              condition_display: 'Хорошее',
              is_in_stock: false,
              status_display: 'У работника'
            }
          ]
        })
      })
    })

    await page.goto('/tools_index')
    
    // Apply condition filter
    await page.getByLabel('Состояние').selectOption('good')
    
    // Wait for filtered results
    await expect(page.getByText('TOOL001')).toBeVisible()
    await expect(page.getByText('TOOL002')).toBeVisible()
    
    // TOOL003 with "needs_repair" should not be visible
    await expect(page.getByText('TOOL003')).not.toBeVisible()
  })

  test('should filter tools by stock status', async ({ page }) => {
    // Mock "in stock" filter
    await page.route('**/api/v1/tools/?in_stock=true', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            {
              id: 1,
              inventory_number: 'TOOL001',
              name: 'Перфоратор Makita HR2470',
              is_in_stock: true,
              status_display: 'На складе'
            },
            {
              id: 3,
              inventory_number: 'TOOL003',
              name: 'Углошлифовальная машина DeWalt DWE4057',
              is_in_stock: true,
              status_display: 'На складе'
            }
          ]
        })
      })
    })

    await page.goto('/tools_index')
    
    // Apply in stock filter
    await page.getByLabel('Местоположение').selectOption('true')
    
    // Wait for filtered results
    await expect(page.getByText('TOOL001')).toBeVisible()
    await expect(page.getByText('TOOL003')).toBeVisible()
    
    // TOOL002 (issued) should not be visible
    await expect(page.getByText('TOOL002')).not.toBeVisible()
  })

  test('should search tools', async ({ page }) => {
    // Mock search API
    await page.route('**/api/v1/tools/?search=Makita', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [
            {
              id: 1,
              inventory_number: 'TOOL001',
              name: 'Перфоратор Makita HR2470',
              category: 'Перфоратор, SDS-Plus',
              brand: 'Makita',
              condition: 'good',
              is_in_stock: true,
              status_display: 'На складе'
            }
          ]
        })
      })
    })

    await page.goto('/tools_index')
    
    // Perform search
    await page.getByLabel('Поиск').fill('Makita')
    await page.getByLabel('Поиск').press('Enter')
    
    // Check search results
    await expect(page.getByText('TOOL001')).toBeVisible()
    await expect(page.getByText('Перфоратор Makita HR2470')).toBeVisible()
    
    // Other tools should not be visible
    await expect(page.getByText('TOOL002')).not.toBeVisible()
    await expect(page.getByText('TOOL003')).not.toBeVisible()
  })

  test('should create new tool', async ({ page }) => {
    // Mock categories API
    await page.route('**/api/v1/tools/categories/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          categories: ['Перфоратор', 'Дрель', 'УШМ', 'Болгарка']
        })
      })
    })

    // Mock tool creation API
    await page.route('**/api/v1/tools/', async route => {
      if (route.request().method() === 'POST') {
        const requestData = await route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 4,
            inventory_number: requestData.inventory_number,
            name: requestData.name,
            category: requestData.category,
            brand: requestData.brand,
            condition: 'good',
            is_in_stock: true,
            status_display: 'На складе',
            created_at: '2024-01-04T00:00:00Z',
            updated_at: '2024-01-04T00:00:00Z'
          })
        })
      }
    })

    await page.goto('/tools_index')
    
    // Click create button
    await page.getByRole('button', { name: 'Добавить инструмент' }).click()
    
    // Fill form
    await page.getByLabel('Инв. номер').fill('TOOL004')
    await page.getByLabel('Название').fill('Новый инструмент')
    await page.getByLabel('Категория').fill('Новая категория')
    await page.getByLabel('Марка').fill('Новая марка')
    
    // Submit form
    await page.getByRole('button', { name: 'Сохранить' }).click()
    
    // Check success message
    await expect(page.getByText('Инструмент успешно добавлен')).toBeVisible()
    
    // Modal should close
    await expect(page.getByLabel('Инв. номер')).not.toBeVisible()
  })

  test('should issue tool to employee', async ({ page }) => {
    // Mock employees API
    await page.route('**/api/v1/employees/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [
            { id: 2, username: 'worker', first_name: 'Иванов', last_name: 'Иван' }
          ]
        })
      })
    })

    // Mock objects API
    await page.route('**/api/v1/objects/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [
            { id: 1, name: 'ЖК Солнечный', location: 'г. Москва' }
          ]
        })
      })
    })

    // Mock tool issue API
    await page.route('**/api/v1/tool-issues/issue/', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            tool: 1,
            tool_name: 'Перфоратор Makita HR2470',
            tool_inventory_number: 'TOOL001',
            issued_by: 1,
            issued_by_name: 'Admin User',
            issued_to: 2,
            issued_to_name: 'Иванов Иван',
            issued_at: '2024-01-04T10:00:00Z',
            object: 1,
            object_name: 'ЖК Солнечный',
            issue_condition: 'good',
            issue_condition_display: 'Хорошее',
            issue_comment: '',
            return_date: null,
            return_condition: null,
            return_condition_display: null,
            return_comment: '',
            is_returned: false,
            is_open: true,
            duration_days: 0
          })
        })
      }
    })

    // Mock initial tools list (with available tool)
    await page.route('**/api/v1/tools/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: [
              {
                id: 1,
                inventory_number: 'TOOL001',
                name: 'Перфоратор Makita HR2470',
                category: 'Перфоратор, SDS-Plus',
                brand: 'Makita',
                current_holder: null,
                current_holder_name: null,
                current_object: null,
                current_object_name: null,
                condition: 'good',
                condition_display: 'Хорошее',
                is_in_stock: true,
                status_display: 'На складе'
              }
            ]
          })
        })
      }
    })

    await page.goto('/tools_index')
    
    // Click issue button for TOOL001
    await page.getByRole('button', { name: 'Выдать' }).first().click()
    
    // Fill issue form
    await page.getByLabel('Кому выдать').selectOption('2')
    await page.getByLabel('Объект').selectOption('1')
    await page.getByLabel('Состояние при выдаче').selectOption('good')
    
    // Submit form
    await page.getByRole('button', { name: 'Выдать' }).click()
    
    // Check success message
    await expect(page.getByText('Инструмент выдан успешно')).toBeVisible()
  })

  test('should return tool to warehouse', async ({ page }) => {
    // Mock return API
    await page.route('**/api/v1/tool-issues/1/return/', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            tool: 2,
            tool_name: 'Дрель Bosch GSB 13 RE',
            tool_inventory_number: 'TOOL002',
            issued_by: 1,
            issued_by_name: 'Admin User',
            issued_to: 2,
            issued_to_name: 'Иванов Иван',
            issued_at: '2024-01-02T10:00:00Z',
            object: 1,
            object_name: 'ЖК Солнечный',
            issue_condition: 'good',
            issue_condition_display: 'Хорошее',
            issue_comment: '',
            return_date: '2024-01-04T14:00:00Z',
            return_condition: 'needs_repair',
            return_condition_display: 'Требует ремонта',
            return_comment: 'Требует замены сверла',
            is_returned: true,
            is_open: false,
            duration_days: 2
          })
        })
      }
    })

    // Mock tools list with issued tool
    await page.route('**/api/v1/tools/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: [
              {
                id: 2,
                inventory_number: 'TOOL002',
                name: 'Дрель Bosch GSB 13 RE',
                category: 'Дрель',
                brand: 'Bosch',
                current_holder: 2,
                current_holder_name: 'Иванов Иван',
                current_object: 1,
                current_object_name: 'ЖК Солнечный',
                condition: 'good',
                condition_display: 'Хорошее',
                is_in_stock: false,
                status_display: 'У Иванов Иван (объект: ЖК Солнечный)'
              }
            ]
          })
        })
      }
    })

    // Mock tool issues to get the active issue
    await page.route('**/api/v1/tool-issues/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: [
              {
                id: 1,
                tool: 2,
                tool_name: 'Дрель Bosch GSB 13 RE',
                tool_inventory_number: 'TOOL002',
                issued_to: 2,
                issued_to_name: 'Иванов Иван',
                is_open: true,
                is_returned: false
              }
            ]
          })
        })
      }
    })

    await page.goto('/tools_index')
    
    // Click return button for TOOL002
    await page.getByRole('button', { name: 'Вернуть' }).first().click()
    
    // Fill return form
    await page.getByLabel('Состояние при возврате').selectOption('needs_repair')
    await page.getByLabel('Комментарий').fill('Требует замены сверла')
    
    // Submit form
    await page.getByRole('button', { name: 'Принять возврат' }).click()
    
    // Check success message
    await expect(page.getByText('Инструмент возвращен успешно')).toBeVisible()
  })

  test('should display tool history', async ({ page }) => {
    // Mock tool history API
    await page.route('**/api/v1/tool-issues/?tool=1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            {
              id: 2,
              tool: 1,
              tool_name: 'Перфоратор Makita HR2470',
              tool_inventory_number: 'TOOL001',
              issued_by: 1,
              issued_by_name: 'Admin User',
              issued_to: 2,
              issued_to_name: 'Иванов Иван',
              issued_at: '2024-01-02T10:00:00Z',
              object: 1,
              object_name: 'ЖК Солнечный',
              issue_condition: 'good',
              issue_condition_display: 'Хорошее',
              issue_comment: 'Для бурения отверстий',
              return_date: '2024-01-04T16:00:00Z',
              return_condition: 'good',
              return_condition_display: 'Хорошее',
              return_comment: 'Работал отлично',
              is_returned: true,
              is_open: false,
              duration_days: 2
            },
            {
              id: 1,
              tool: 1,
              tool_name: 'Перфоратор Makita HR2470',
              tool_inventory_number: 'TOOL001',
              issued_by: 1,
              issued_by_name: 'Admin User',
              issued_to: 3,
              issued_to_name: 'Петров Петр',
              issued_at: '2024-01-01T09:00:00Z',
              object: 1,
              object_name: 'ЖК Солнечный',
              issue_condition: 'good',
              issue_condition_display: 'Хорошее',
              issue_comment: '',
              return_date: '2024-01-01T18:00:00Z',
              return_condition: 'good',
              return_condition_display: 'Хорошее',
              return_comment: '',
              is_returned: true,
              is_open: false,
              duration_days: 0
            }
          ]
        })
      })
    })

    await page.goto('/tools_index')
    
    // Click history button for TOOL001
    await page.getByText('TOOL001').click()
    
    // Check history modal opens
    await expect(page.getByText('История инструмента')).toBeVisible()
    
    // Check history entries
    await expect(page.getByText('Иванов Иван')).toBeVisible()
    await expect(page.getByText('Петров Петр')).toBeVisible()
    await expect(page.getByText('ЖК Солнечный')).toBeVisible()
    await expect(page.getByText('Для бурения отверстий')).toBeVisible()
    await expect(page.getByText('Работал отлично')).toBeVisible()
    
    // Check duration
    await expect(page.getByText('2 дн.')).toBeVisible()
    await expect(page.getByText('0 дн.')).toBeVisible()
  })

  test('should open bulk add modal', async ({ page }) => {
    await page.goto('/tools_index')
    
    // Click bulk add button
    await page.getByRole('button', { name: 'Массовое добавление' }).click()
    
    // Check modal opens
    await expect(page.getByText('Массовое добавление инструментов')).toBeVisible()
    
    // Check form fields are present
    await expect(page.getByLabel('Кому выдать')).toBeVisible()
    await expect(page.getByLabel('На какой объект')).toBeVisible()
    
    // Close modal
    await page.getByRole('button', { name: '×' }).click()
    
    // Modal should close
    await expect(page.getByText('Массовое добавление инструментов')).not.toBeVisible()
  })
})

