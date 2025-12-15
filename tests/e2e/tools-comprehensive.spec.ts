import { test, expect } from '@playwright/test'

test.describe('Tools System - Comprehensive E2E Tests', () => {
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

  test('comprehensive tools workflow', async ({ page }) => {
    let toolId = 1
    let issueId = 1

    // Mock APIs for the complete workflow
    
    // 1. Initial tools list (empty)
    await page.route('**/api/v1/tools/**', async route => {
      if (route.request().method() === 'GET' && route.request().url().includes('/api/v1/tools/?')) {
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

    // 2. Categories for autocomplete
    await page.route('**/api/v1/tools/categories/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          categories: ['Перфоратор', 'Дрель', 'УШМ', 'Болгарка', 'Лобзик']
        })
      })
    })

    // 3. Employees API
    await page.route('**/api/v1/employees/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 3,
          results: [
            { id: 1, username: 'admin', first_name: 'Admin', last_name: 'User' },
            { id: 2, username: 'worker1', first_name: 'Иванов', last_name: 'Иван' },
            { id: 3, username: 'worker2', first_name: 'Петров', last_name: 'Петр' }
          ]
        })
      })
    })

    // 4. Objects API
    await page.route('**/api/v1/objects/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            { id: 1, name: 'ЖК Солнечный', location: 'г. Москва, ул. Ленина, 1' },
            { id: 2, name: 'Дом на Арбате', location: 'г. Москва, Арбат, 10' }
          ]
        })
      })
    })

    // Navigate to tools
    await page.goto('/tools_index')
    await expect(page.getByText('Инструменты')).toBeVisible()
    await expect(page.getByText('Нет инструментов')).toBeVisible()

    // === STEP 1: Create new tool ===
    
    // Mock tool creation
    await page.route('**/api/v1/tools/', async route => {
      if (route.request().method() === 'POST') {
        const requestData = await route.request().postDataJSON()
        const newTool = {
          id: toolId++,
          inventory_number: requestData.inventory_number,
          name: requestData.name,
          category: requestData.category,
          brand: requestData.brand,
          current_holder: null,
          current_holder_name: null,
          current_object: null,
          current_object_name: null,
          condition: 'good',
          condition_display: 'Хорошее',
          is_in_stock: true,
          status_display: 'На складе',
          created_at: '2024-01-04T10:00:00Z',
          updated_at: '2024-01-04T10:00:00Z'
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newTool)
        })

        // Update tools list mock to include new tool
        await page.route('**/api/v1/tools/**', async route => {
          if (route.request().method() === 'GET') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                count: 1,
                results: [newTool]
              })
            })
          }
        })
      }
    })

    // Click create tool
    await page.getByRole('button', { name: 'Добавить инструмент' }).click()
    await expect(page.getByText('Новый инструмент')).toBeVisible()

    // Fill form
    await page.getByLabel('Инв. номер').fill('E2E001')
    await page.getByLabel('Название').fill('Перфоратор для E2E тестов')
    await page.getByLabel('Категория').fill('Перфоратор, SDS-Plus')
    await page.getByLabel('Марка').fill('TestBrand')

    // Submit form
    await page.getByRole('button', { name: 'Сохранить' }).click()
    
    // Check success
    await expect(page.getByText('Инструмент успешно добавлен')).toBeVisible()
    
    // Tool should appear in list
    await expect(page.getByText('E2E001')).toBeVisible()
    await expect(page.getByText('Перфоратор для E2E тестов')).toBeVisible()
    await expect(page.getByText('На складе')).toBeVisible()

    // === STEP 2: Issue tool ===
    
    // Mock tool issue creation
    await page.route('**/api/v1/tool-issues/issue/', async route => {
      if (route.request().method() === 'POST') {
        const requestData = await route.request().postDataJSON()
        const newIssue = {
          id: issueId++,
          tool: requestData.tool,
          tool_name: 'Перфоратор для E2E тестов',
          tool_inventory_number: 'E2E001',
          tool_category: 'Перфоратор, SDS-Plus',
          tool_brand: 'TestBrand',
          issued_by: 1,
          issued_by_name: 'Admin User',
          issued_to: requestData.issued_to,
          issued_to_name: requestData.issued_to === 2 ? 'Иванов Иван' : 'Петров Петр',
          issued_at: '2024-01-04T11:00:00Z',
          object: requestData.object,
          object_name: requestData.object === 1 ? 'ЖК Солнечный' : 'Дом на Арбате',
          issue_condition: requestData.issue_condition,
          issue_condition_display: 'Хорошее',
          issue_comment: requestData.issue_comment || '',
          return_date: null,
          return_condition: null,
          return_condition_display: null,
          return_comment: '',
          is_returned: false,
          is_open: true,
          duration_days: 0,
          created_at: '2024-01-04T11:00:00Z',
          updated_at: '2024-01-04T11:00:00Z'
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newIssue)
        })

        // Update tools list to show tool as issued
        await page.route('**/api/v1/tools/**', async route => {
          if (route.request().method() === 'GET') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                count: 1,
                results: [{
                  id: 1,
                  inventory_number: 'E2E001',
                  name: 'Перфоратор для E2E тестов',
                  category: 'Перфоратор, SDS-Plus',
                  brand: 'TestBrand',
                  current_holder: 2,
                  current_holder_name: 'Иванов Иван',
                  current_object: 1,
                  current_object_name: 'ЖК Солнечный',
                  condition: 'good',
                  condition_display: 'Хорошее',
                  is_in_stock: false,
                  status_display: 'У Иванов Иван (объект: ЖК Солнечный)',
                  created_at: '2024-01-04T10:00:00Z',
                  updated_at: '2024-01-04T11:00:00Z'
                }]
              })
            })
          }
        })
      }
    })

    // Click issue button
    await page.getByRole('button', { name: 'Выдать' }).click()
    await expect(page.getByText('Выдать инструмент')).toBeVisible()

    // Fill issue form
    await page.getByLabel('Кому выдать').selectOption('2')
    await page.getByLabel('Объект').selectOption('1')
    await page.getByLabel('Состояние при выдаче').selectOption('good')
    await page.getByLabel('Комментарий').fill('Для бурения отверстий в фундаменте')

    // Submit issue form
    await page.getByRole('button', { name: 'Выдать' }).click()
    
    // Check success
    await expect(page.getByText('Инструмент выдан успешно')).toBeVisible()
    
    // Refresh page to see updated status
    await page.reload()
    await expect(page.getByText('У Иванов Иван (объект: ЖК Солнечный)')).toBeVisible()

    // === STEP 3: Check tool issues list ===
    
    // Mock tool issues list
    await page.route('**/api/v1/tool-issues/**', async route => {
      if (route.request().method() === 'GET' && route.request().url().includes('/api/v1/tool-issues/?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: [{
              id: 1,
              tool: 1,
              tool_name: 'Перфоратор для E2E тестов',
              tool_inventory_number: 'E2E001',
              tool_category: 'Перфоратор, SDS-Plus',
              tool_brand: 'TestBrand',
              issued_by: 1,
              issued_by_name: 'Admin User',
              issued_to: 2,
              issued_to_name: 'Иванов Иван',
              issued_at: '2024-01-04T11:00:00Z',
              object: 1,
              object_name: 'ЖК Солнечный',
              issue_condition: 'good',
              issue_condition_display: 'Хорошее',
              issue_comment: 'Для бурения отверстий в фундаменте',
              return_date: null,
              return_condition: null,
              return_condition_display: null,
              return_comment: '',
              is_returned: false,
              is_open: true,
              duration_days: 0
            }]
          })
        })
      }
    })

    // Navigate to tool issues
    await page.goto('/tools_issues')
    await expect(page.getByText('Выдачи инструментов')).toBeVisible()
    
    // Check issue is displayed
    await expect(page.getByText('E2E001')).toBeVisible()
    await expect(page.getByText('Иванов Иван')).toBeVisible()
    await expect(page.getByText('ЖК Солнечный')).toBeVisible()
    await expect(page.getByText('Активна')).toBeVisible()

    // === STEP 4: Return tool ===
    
    // Mock tool return
    await page.route('**/api/v1/tool-issues/1/return/', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            tool: 1,
            tool_name: 'Перфоратор для E2E тестов',
            tool_inventory_number: 'E2E001',
            tool_category: 'Перфоратор, SDS-Plus',
            tool_brand: 'TestBrand',
            issued_by: 1,
            issued_by_name: 'Admin User',
            issued_to: 2,
            issued_to_name: 'Иванов Иван',
            issued_at: '2024-01-04T11:00:00Z',
            object: 1,
            object_name: 'ЖК Солнечный',
            issue_condition: 'good',
            issue_condition_display: 'Хорошее',
            issue_comment: 'Для бурения отверстий в фундаменте',
            return_date: '2024-01-04T18:00:00Z',
            return_condition: 'needs_repair',
            return_condition_display: 'Требует ремонта',
            return_comment: 'Требуется замена сверла',
            is_returned: true,
            is_open: false,
            duration_days: 0
          })
        })
      }
    })

    // Click return button
    await page.getByRole('button', { name: 'Вернуть' }).click()
    await expect(page.getByText('Возврат инструмента')).toBeVisible()

    // Fill return form
    await page.getByLabel('Состояние при возврате').selectOption('needs_repair')
    await page.getByLabel('Комментарий').fill('Требуется замена сверла')

    // Submit return form
    await page.getByRole('button', { name: 'Принять возврат' }).click()
    
    // Check success
    await expect(page.getByText('Инструмент возвращен успешно')).toBeVisible()

    // === STEP 5: View tool history ===
    
    // Mock tool history
    await page.route('**/api/v1/tool-issues/?tool=1', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [{
            id: 1,
            tool: 1,
            tool_name: 'Перфоратор для E2E тестов',
            tool_inventory_number: 'E2E001',
            issued_by: 1,
            issued_by_name: 'Admin User',
            issued_to: 2,
            issued_to_name: 'Иванов Иван',
            issued_at: '2024-01-04T11:00:00Z',
            object: 1,
            object_name: 'ЖК Солнечный',
            issue_condition: 'good',
            issue_condition_display: 'Хорошее',
            issue_comment: 'Для бурения отверстий в фундаменте',
            return_date: '2024-01-04T18:00:00Z',
            return_condition: 'needs_repair',
            return_condition_display: 'Требует ремонта',
            return_comment: 'Требуется замена сверла',
            is_returned: true,
            is_open: false,
            duration_days: 0
          }]
        })
      })
    })

    // Go back to tools list
    await page.goto('/tools_index')
    
    // Update tools mock to show returned tool
    await page.route('**/api/v1/tools/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: [{
              id: 1,
              inventory_number: 'E2E001',
              name: 'Перфоратор для E2E тестов',
              category: 'Перфоратор, SDS-Plus',
              brand: 'TestBrand',
              current_holder: null,
              current_holder_name: null,
              current_object: null,
              current_object_name: null,
              condition: 'needs_repair',
              condition_display: 'Требует ремонта',
              is_in_stock: true,
              status_display: 'На складе',
              created_at: '2024-01-04T10:00:00Z',
              updated_at: '2024-01-04T18:00:00Z'
            }]
          })
        })
      }
    })

    await page.reload()
    
    // Click on inventory number to view history
    await page.getByText('E2E001').click()
    await expect(page.getByText('История инструмента')).toBeVisible()
    
    // Check history details
    await expect(page.getByText('Иванов Иван')).toBeVisible()
    await expect(page.getByText('ЖК Солнечный')).toBeVisible()
    await expect(page.getByText('Для бурения отверстий в фундаменте')).toBeVisible()
    await expect(page.getByText('Требуется замена сверла')).toBeVisible()
    await expect(page.getByText('Требует ремонта')).toBeVisible()

    // Close history modal
    await page.getByRole('button', { name: '×' }).click()

    // === STEP 6: Test filtering ===
    
    // Mock filtered results
    await page.route('**/api/v1/tools/?condition=needs_repair', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [{
            id: 1,
            inventory_number: 'E2E001',
            name: 'Перфоратор для E2E тестов',
            category: 'Перфоратор, SDS-Plus',
            brand: 'TestBrand',
            condition: 'needs_repair',
            condition_display: 'Требует ремонта',
            is_in_stock: true,
            status_display: 'На складе'
          }]
        })
      })
    })

    // Apply condition filter
    await page.getByLabel('Состояние').selectOption('needs_repair')
    
    // Check filtered results
    await expect(page.getByText('E2E001')).toBeVisible()
    await expect(page.getByText('Требует ремонта')).toBeVisible()

    // Reset filters
    await page.getByRole('button', { name: 'Сбросить фильтры' }).click()
  })

  test('bulk tool creation and issuance', async ({ page }) => {
    // Mock bulk creation API
    await page.route('**/api/v1/tools/bulk-create/', async route => {
      if (route.request().method() === 'POST') {
        const requestData = await route.request().postDataJSON()
        
        const tools = requestData.tools.map((tool: any, index: number) => ({
          id: 10 + index,
          inventory_number: tool.inventory_number,
          name: tool.name,
          category: tool.category || '',
          brand: tool.brand || '',
          current_holder: requestData.auto_issue ? requestData.issued_to : null,
          current_holder_name: requestData.auto_issue ? 'Иванов Иван' : null,
          current_object: requestData.auto_issue ? requestData.object : null,
          current_object_name: requestData.auto_issue ? 'ЖК Солнечный' : null,
          condition: requestData.auto_issue ? requestData.issue_condition : 'good',
          condition_display: requestData.auto_issue ? 'Хорошее' : 'Хорошее',
          is_in_stock: !requestData.auto_issue,
          status_display: requestData.auto_issue ? 'У Иванов Иван (объект: ЖК Солнечный)' : 'На складе'
        }))

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            tools: tools,
            created_count: tools.length,
            issued_count: requestData.auto_issue ? tools.length : 0
          })
        })
      }
    })

    // Mock categories
    await page.route('**/api/v1/tools/categories/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          categories: ['Перфоратор', 'Дрель', 'УШМ', 'Болгарка']
        })
      })
    })

    // Mock employees and objects
    await page.route('**/api/v1/employees/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          results: [
            { id: 2, username: 'worker1', first_name: 'Иванов', last_name: 'Иван' },
            { id: 3, username: 'worker2', first_name: 'Петров', last_name: 'Петр' }
          ]
        })
      })
    })

    await page.route('**/api/v1/objects/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [
            { id: 1, name: 'ЖК Солнечный', location: 'г. Москва, ул. Ленина, 1' }
          ]
        })
      })
    })

    await page.goto('/tools_index')
    
    // Open bulk add modal
    await page.getByRole('button', { name: 'Массовое добавление' }).click()
    await expect(page.getByText('Массовое добавление инструментов')).toBeVisible()

    // Fill bulk form
    await page.getByLabel('Кому выдать').selectOption('2')
    await page.getByLabel('На какой объект').selectOption('1')

    // Add first tool
    await page.getByLabel('Инв. номер').first().fill('BULK001')
    await page.getByLabel('Название').first().fill('Дрель Makita DF330D')
    await page.getByLabel('Категория').first().fill('Дрель')
    await page.getByLabel('Марка').first().fill('Makita')
    await page.getByLabel('Состояние при выдаче').first().selectOption('good')

    // Add second tool
    await page.getByRole('button', { name: 'Добавить инструмент' }).click()
    
    const toolInputs = page.locator('[data-tool-index="1"]')
    await toolInputs.getByLabel('Инв. номер').fill('BULK002')
    await toolInputs.getByLabel('Название').fill('УШМ DeWalt DWE4057')
    await toolInputs.getByLabel('Категория').fill('УШМ, Болгарка')
    await toolInputs.getByLabel('Марка').fill('DeWalt')
    await toolInputs.getByLabel('Состояние при выдаче').selectOption('good')

    // Submit bulk form
    await page.getByRole('button', { name: 'Создать и выдать' }).click()
    
    // Check success
    await expect(page.getByText('Создано инструментов: 2, выдано: 2')).toBeVisible()
  })

  test('tools filtering and search', async ({ page }) => {
    const allTools = [
      {
        id: 1,
        inventory_number: 'DRILL001',
        name: 'Дрель Bosch GSB 13 RE',
        category: 'Дрель',
        brand: 'Bosch',
        condition: 'good',
        condition_display: 'Хорошее',
        current_holder: null,
        is_in_stock: true,
        status_display: 'На складе'
      },
      {
        id: 2,
        inventory_number: 'HAMMER001',
        name: 'Перфоратор Makita HR2470',
        category: 'Перфоратор, SDS-Plus',
        brand: 'Makita',
        condition: 'needs_repair',
        condition_display: 'Требует ремонта',
        current_holder: null,
        is_in_stock: true,
        status_display: 'На складе'
      },
      {
        id: 3,
        inventory_number: 'SAW001',
        name: 'Циркулярная пила DeWalt DCS391N',
        category: 'Пила',
        brand: 'DeWalt',
        condition: 'good',
        condition_display: 'Хорошее',
        current_holder: 2,
        current_holder_name: 'Иванов Иван',
        current_object: 1,
        current_object_name: 'ЖК Солнечный',
        is_in_stock: false,
        status_display: 'У Иванов Иван (объект: ЖК Солнечный)'
      }
    ]

    // Mock initial list
    await page.route('**/api/v1/tools/**', async route => {
      const url = route.request().url()
      
      if (url.includes('search=Bosch')) {
        // Search results
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: [allTools[0]] // Only Bosch drill
          })
        })
      } else if (url.includes('condition=good')) {
        // Condition filter
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            results: allTools.filter(t => t.condition === 'good')
          })
        })
      } else if (url.includes('in_stock=true')) {
        // In stock filter
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            results: allTools.filter(t => t.is_in_stock)
          })
        })
      } else if (url.includes('in_stock=false')) {
        // Issued filter
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: allTools.filter(t => !t.is_in_stock)
          })
        })
      } else if (url.includes('category=Дрель')) {
        // Category filter
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 1,
            results: allTools.filter(t => t.category.includes('Дрель'))
          })
        })
      } else {
        // Default - all tools
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 3,
            results: allTools
          })
        })
      }
    })

    await page.goto('/tools_index')
    
    // Check all tools are displayed initially
    await expect(page.getByText('DRILL001')).toBeVisible()
    await expect(page.getByText('HAMMER001')).toBeVisible()
    await expect(page.getByText('SAW001')).toBeVisible()

    // Test search
    await page.getByLabel('Поиск').fill('Bosch')
    await page.getByLabel('Поиск').press('Enter')
    
    await expect(page.getByText('DRILL001')).toBeVisible()
    await expect(page.getByText('Дрель Bosch GSB 13 RE')).toBeVisible()
    await expect(page.getByText('HAMMER001')).not.toBeVisible()
    await expect(page.getByText('SAW001')).not.toBeVisible()

    // Reset search
    await page.getByLabel('Поиск').fill('')
    await page.getByLabel('Поиск').press('Enter')

    // Test condition filter
    await page.getByLabel('Состояние').selectOption('good')
    
    await expect(page.getByText('DRILL001')).toBeVisible()
    await expect(page.getByText('SAW001')).toBeVisible()
    await expect(page.getByText('HAMMER001')).not.toBeVisible()

    // Test stock status filter
    await page.getByLabel('Состояние').selectOption('') // Reset condition
    await page.getByLabel('Местоположение').selectOption('true') // In stock only
    
    await expect(page.getByText('DRILL001')).toBeVisible()
    await expect(page.getByText('HAMMER001')).toBeVisible()
    await expect(page.getByText('SAW001')).not.toBeVisible()

    // Test issued filter
    await page.getByLabel('Местоположение').selectOption('false') // Issued only
    
    await expect(page.getByText('SAW001')).toBeVisible()
    await expect(page.getByText('У Иванов Иван (объект: ЖК Солнечный)')).toBeVisible()
    await expect(page.getByText('DRILL001')).not.toBeVisible()
    await expect(page.getByText('HAMMER001')).not.toBeVisible()

    // Reset all filters
    await page.getByRole('button', { name: 'Сбросить фильтры' }).click()
    
    // All tools should be visible again
    await expect(page.getByText('DRILL001')).toBeVisible()
    await expect(page.getByText('HAMMER001')).toBeVisible()
    await expect(page.getByText('SAW001')).toBeVisible()
  })

  test('tools permission control', async ({ page }) => {
    // Test with non-admin user
    await page.route('**/api/v1/users/me/', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          username: 'brigadier',
          first_name: 'Brigadier',
          last_name: 'User',
          email: 'brigadier@example.com',
          role: 'brigadier' // Not admin
        })
      })
    })

    // Mock 403 response for tools API
    await page.route('**/api/v1/tools/**', async route => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'You do not have permission to perform this action.'
        })
      })
    })

    // Try to access tools page
    await page.goto('/tools_index')
    
    // Should show access denied or redirect
    await expect(page.getByText('Недостаточно прав')).toBeVisible()
    // OR should redirect away from tools page
    // await expect(page).not.toHaveURL('/tools_index')
  })

  test('error handling in tools operations', async ({ page }) => {
    await page.goto('/tools_index')

    // Mock server error for tools list
    await page.route('**/api/v1/tools/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Internal server error'
          })
        })
      }
    })

    await page.reload()
    
    // Should show error message
    await expect(page.getByText('Ошибка при загрузке')).toBeVisible()
    await expect(page.getByText('Внутренняя ошибка сервера')).toBeVisible()

    // Should have retry button
    const retryButton = page.getByRole('button', { name: 'Повторить' })
    if (await retryButton.isVisible()) {
      await retryButton.click()
      // Should attempt to reload data
    }
  })

  test('navigation between tools sections', async ({ page }) => {
    // Mock tools data
    await page.route('**/api/v1/tools/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [{
            id: 1,
            inventory_number: 'NAV001',
            name: 'Navigation Test Tool',
            is_in_stock: false,
            current_holder_name: 'Test User',
            status_display: 'У Test User'
          }]
        })
      })
    })

    // Mock tool issues data
    await page.route('**/api/v1/tool-issues/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          results: [{
            id: 1,
            tool: 1,
            tool_name: 'Navigation Test Tool',
            tool_inventory_number: 'NAV001',
            issued_to_name: 'Test User',
            is_open: true,
            issue_condition_display: 'Хорошее'
          }]
        })
      })
    })

    // Start at tools list
    await page.goto('/tools_index')
    await expect(page.getByText('Инструменты')).toBeVisible()
    await expect(page.getByText('NAV001')).toBeVisible()

    // Navigate to tool issues
    await page.goto('/tools_issues')
    await expect(page.getByText('Выдачи инструментов')).toBeVisible()
    await expect(page.getByText('Navigation Test Tool')).toBeVisible()
    await expect(page.getByText('Test User')).toBeVisible()

    // Navigate back to tools
    await page.goto('/tools_index')
    await expect(page.getByText('Инструменты')).toBeVisible()
  })
})

