#!/usr/bin/env node

/**
 * 🔧 Скрипт для исправления пагинации в отчетах
 * Отчеты не поддерживают пагинацию на сервере согласно API схеме
 */

const fs = require('fs');
const path = require('path');

const reportFiles = [
  'src/pages/Reports/ByMaterial.vue',
  'src/pages/Reports/ByObject.vue',
  'src/pages/Reports/ByResponsible.vue'
];

function fixReportFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Файл не найден: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Удаляем пагинацию из template
    content = content.replace(
      /<!-- Pagination -->[\s\S]*?<\/ModernPagination>/,
      '<!-- Отчеты не поддерживают пагинацию -->'
    );

    // Удаляем переменные пагинации
    content = content.replace(
      /\/\/ Pagination[\s\S]*?const totalPages = computed\(\(\) => Math\.ceil\(totalItems\.value \/ pageSize\.value\)\)/,
      '// Отчеты не поддерживают пагинацию'
    );

    // Удаляем функции пагинации
    content = content.replace(
      /function handlePageChange\(newPage: number\) \{[\s\S]*?\}/,
      '// Функции пагинации не нужны для отчетов'
    );

    content = content.replace(
      /function handlePageSizeChange\(newSize: number\) \{[\s\S]*?\}/,
      ''
    );

    // Удаляем пагинацию из запросов
    content = content.replace(
      /\/\/ Добавляем пагинацию[\s\S]*?query\.page_size = pageSize\.value/,
      '// Отчеты не поддерживают пагинацию на сервере'
    );

    // Удаляем totalItems из обработки ответов
    content = content.replace(
      /totalItems\.value = data\.rows\.length/,
      ''
    );

    content = content.replace(
      /totalItems\.value = 0/,
      ''
    );

    // Обновляем TableSkeleton
    content = content.replace(
      /:rows="pageSize"/,
      ':rows="5"'
    );

    // Очищаем лишние пустые строки
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Исправлен: ${filePath}`);
    } else {
      console.log(`⏭️  Пропущен (нет изменений): ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🔧 Исправление пагинации в отчетах...\n');

  reportFiles.forEach(file => {
    fixReportFile(file);
  });

  console.log('\n✅ Исправление завершено!');
  console.log('📝 Отчеты теперь не используют пагинацию согласно API схеме');
}

main();
