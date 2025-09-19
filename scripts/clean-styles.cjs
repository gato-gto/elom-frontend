#!/usr/bin/env node

/**
 * 🧹 Простой скрипт для полной очистки стилей
 */

const fs = require('fs');
const path = require('path');

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

function cleanFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Файл не найден: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Заменяем весь блок <style scoped> на простой комментарий
    const styleRegex = /<style scoped>[\s\S]*?<\/style>/;
    const replacement = '<style scoped>\n/* Все анимации теперь в @/styles/animations.css */\n</style>';
    
    if (styleRegex.test(content)) {
      content = content.replace(styleRegex, replacement);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Очищен: ${filePath}`);
    } else {
      console.log(`⏭️  Пропущен (нет стилей): ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Ошибка при обработке ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Полная очистка дублирующихся стилей...\n');

  filesToProcess.forEach(file => {
    cleanFile(file);
  });

  console.log('\n✅ Очистка завершена!');
}

main();
