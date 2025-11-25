#!/usr/bin/env node
/* eslint-env node */

/**
 * 🔧 Скрипт для восстановления пагинации в отчетах
 * API теперь поддерживает пагинацию для отчетов
 */

const fs = require('fs');
const path = require('path');

const reportFiles = [
  'src/pages/Reports/ByMaterial.vue',
  'src/pages/Reports/ByObject.vue',
  'src/pages/Reports/ByResponsible.vue'
];

function restorePaginationInReport(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Файл не найден: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Восстанавливаем переменные пагинации
    content = content.replace(
      /\/\/ Отчеты не поддерживают пагинацию/,
      `// Pagination
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))`
    );

    // Восстанавливаем пагинацию в запросах
    content = content.replace(
      /\/\/ Отчеты не поддерживают пагинацию на сервере/,
      `// Добавляем пагинацию
    query.page = currentPage.value
    query.page_size = pageSize.value`
    );

    // Обновляем обработку ответов (rows -> results)
    content = content.replace(
      /data\.rows/g,
      'data.results'
    );

    content = content.replace(
      /totalItems\.value = data\.rows\.length/,
      'totalItems.value = data.count'
    );

    content = content.replace(
      /totalItems\.value = 0/,
      'totalItems.value = 0'
    );

    // Восстанавливаем функции пагинации
    content = content.replace(
      /\/\/ Функции пагинации не нужны для отчетов/,
      `function handlePageChange(newPage: number) {
  currentPage.value = newPage
  load()
}

function handlePageSizeChange(newSize: number) {
  pageSize.value = newSize
  currentPage.value = 1
  load()
}`
    );

    // Восстанавливаем пагинацию в template
    content = content.replace(
      /<!-- Отчеты не поддерживают пагинацию -->/,
      `<!-- Pagination -->
    <ModernPagination
      v-if="rows.length > 0"
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :page-size="pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />`
    );

    // Очищаем лишние пустые строки
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Восстановлена пагинация: ${filePath}`);
    } else {
      console.log(`⏭️  Пропущен (нет изменений): ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔧 Восстановление пагинации в отчетах...\n');

  reportFiles.forEach(file => {
    restorePaginationInReport(file);
  });

  console.log('\n✅ Восстановление завершено!');
  console.log('📝 Отчеты теперь поддерживают пагинацию согласно API');
}

main();


