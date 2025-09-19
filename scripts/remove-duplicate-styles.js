#!/usr/bin/env node

/**
 * 🧹 Скрипт для удаления дублирующихся стилей анимаций
 * Заменяет все дублирующиеся стили на комментарий о том, что они теперь в общем файле
 */

const fs = require('fs');
const path = require('path');

// Список файлов для обработки
const filesToProcess = [
  'src/pages/Purchases/List.vue',
  'src/pages/Employees/List.vue',
  'src/pages/Units/List.vue',
  'src/pages/Stocks/List.vue',
  'src/pages/Archive/List.vue',
  'src/pages/Reports/ByMaterial.vue',
  'src/pages/Reports/ByObject.vue',
  'src/pages/Reports/ByPeriod.vue',
  'src/pages/Reports/ByResponsible.vue'
];

// Паттерны для поиска дублирующихся стилей
const duplicatePatterns = [
  // Анимации для строк таблицы
  /\/\* Улучшенные анимации для строк таблицы \*\/[\s\S]*?\.table-row\s*\{[\s\S]*?\}/,
  // Shimmer эффекты
  /\.table-row::before\s*\{[\s\S]*?\}/,
  /\.table-row:hover::before\s*\{[\s\S]*?\}/,
  // Loading overlay
  /\/\* Улучшенный overlay для загрузки \*\/[\s\S]*?\.loading-overlay\s*\{[\s\S]*?\}/,
  /:root\.dark \.loading-overlay\s*\{[\s\S]*?\}/,
  // Анимации появления строк
  /\/\* Улучшенная анимация появления строк \*\/[\s\S]*?\.table-row\s*\{[\s\S]*?\}/,
  // Keyframes
  /@keyframes slideInUp\s*\{[\s\S]*?\}/,
  /@keyframes fadeIn\s*\{[\s\S]*?\}/,
  /@keyframes emptyStateFadeIn\s*\{[\s\S]*?\}/,
  /@keyframes modalSlideIn\s*\{[\s\S]*?\}/,
  /@keyframes toastSlideIn\s*\{[\s\S]*?\}/,
  // Задержки анимации
  /\/\* Улучшенные задержки анимации для каждой строки \*\/[\s\S]*?\.table-row:nth-child\(10\)\s*\{[\s\S]*?\}/,
  // Анимации для кнопок
  /\/\* Анимации для кнопок \*\/[\s\S]*?\.btn\s*\{[\s\S]*?\}/,
  /\.btn::before\s*\{[\s\S]*?\}/,
  /\.btn:active::before\s*\{[\s\S]*?\}/,
  /\.btn:hover\s*\{[\s\S]*?\}/,
  // Анимации для фильтров
  /\/\* Анимации для фильтров \*\/[\s\S]*?\.filter-panel:hover\s*\{[\s\S]*?\}/,
  // Анимации для заголовков
  /\/\* Анимации для заголовков \*\/[\s\S]*?:root\.dark th:hover\s*\{[\s\S]*?\}/,
  // Анимации для модальных окон
  /\/\* Анимации для модальных окон \*\/[\s\S]*?\.modal\s*\{[\s\S]*?\}/,
  // Анимации для уведомлений
  /\/\* Анимации для уведомлений \*\/[\s\S]*?\.toast\s*\{[\s\S]*?\}/,
  // Анимации для пагинации
  /\/\* Анимации для пагинации \*\/[\s\S]*?\.pagination-btn:hover\s*\{[\s\S]*?\}/,
  // Анимации для пустого состояния
  /\/\* Анимации для пустого состояния \*\/[\s\S]*?\.empty-state\s*\{[\s\S]*?\}/,
  // Адаптивность
  /\/\* Адаптивность для мобильных устройств \*\/[\s\S]*?\.table-row\s*\{[\s\S]*?\}/,
  // Поддержка reduced motion
  /\/\* Поддержка reduced motion \*\/[\s\S]*?\.loading-overlay\s*\{[\s\S]*?\}/
];

function processFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Файл не найден: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Удаляем все дублирующиеся стили
    duplicatePatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });

    // Очищаем лишние пустые строки
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Если стили были удалены, заменяем на комментарий
    if (content !== originalContent) {
      // Находим тег <style scoped>
      const styleTagMatch = content.match(/<style scoped>([\s\S]*?)<\/style>/);
      
      if (styleTagMatch) {
        const styleContent = styleTagMatch[1].trim();
        
        // Если остались только пустые строки или комментарии, заменяем
        if (!styleContent || styleContent.match(/^\s*$/)) {
          content = content.replace(
            /<style scoped>[\s\S]*?<\/style>/,
            '<style scoped>\n/* Все анимации теперь в @/styles/animations.css */\n</style>'
          );
        }
      }

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Обработан: ${filePath}`);
    } else {
      console.log(`⏭️  Пропущен (нет дублирующихся стилей): ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Удаление дублирующихся стилей анимаций...\n');

  filesToProcess.forEach(file => {
    processFile(file);
  });

  console.log('\n✅ Обработка завершена!');
  console.log('📝 Все анимации теперь находятся в @/styles/animations.css');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, filesToProcess };
