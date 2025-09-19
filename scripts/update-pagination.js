#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Список страниц для обновления
const pagesToUpdate = [
  'src/pages/Employees/List.vue',
  'src/pages/Units/List.vue',
  'src/pages/Objects/List.vue',
  'src/pages/Purchases/List.vue',
  'src/pages/Stocks/List.vue',
  'src/pages/Archive/List.vue'
];

// Шаблон старой пагинации для замены
const oldPaginationPattern = /<!-- Pagination -->\s*<div class="modern-pagination">[\s\S]*?<\/div>/g;

// Новый шаблон пагинации
const newPaginationTemplate = `<!-- Pagination -->
    <ModernPagination
      :current-page="{{storeName}}.pagination.page"
      :total-pages="Math.ceil({{storeName}}.pagination.count / {{storeName}}.pagination.pageSize)"
      :total-items="{{storeName}}.pagination.count"
      :page-size="{{storeName}}.pagination.pageSize"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />`;

// Маппинг имен stores
const storeMapping = {
  'src/pages/Employees/List.vue': 'employeesStore',
  'src/pages/Units/List.vue': 'unitsStore',
  'src/pages/Objects/List.vue': 'objectsStore',
  'src/pages/Purchases/List.vue': 'purchasesStore',
  'src/pages/Stocks/List.vue': 'stocksStore',
  'src/pages/Archive/List.vue': 'archiveStore'
};

function updatePaginationInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Файл не найден: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const storeName = storeMapping[filePath];
  
  if (!storeName) {
    console.log(`Не найден store для файла: ${filePath}`);
    return;
  }

  // Заменяем старую пагинацию на новую
  const newPagination = newPaginationTemplate.replace(/\{\{storeName\}\}/g, storeName);
  const updatedContent = content.replace(oldPaginationPattern, newPagination);

  // Добавляем импорт ModernPagination если его нет
  if (!updatedContent.includes('import ModernPagination')) {
    const importPattern = /(import FilterField from '@/components\/FilterField\.vue')/;
    const importReplacement = `$1\nimport ModernPagination from '@/components/ModernPagination.vue'`;
    const finalContent = updatedContent.replace(importPattern, importReplacement);
    
    // Добавляем обработчик handlePageSizeChange если его нет
    if (!finalContent.includes('handlePageSizeChange')) {
      const pageChangePattern = /(function handlePageChange\(page: number\) \{[\s\S]*?\})/;
      const pageChangeReplacement = `$1\n\nasync function handlePageSizeChange(size: number) {\n  {{storeName}}.setPageSize(size)\n}`;
      const finalContentWithHandler = finalContent.replace(pageChangePattern, pageChangeReplacement.replace(/\{\{storeName\}\}/g, storeName));
      
      fs.writeFileSync(filePath, finalContentWithHandler);
      console.log(`✅ Обновлен: ${filePath}`);
    } else {
      fs.writeFileSync(filePath, finalContent);
      console.log(`✅ Обновлен: ${filePath}`);
    }
  } else {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✅ Обновлен: ${filePath}`);
  }
}

// Обновляем все файлы
console.log('🔄 Обновление пагинации на всех страницах...\n');

pagesToUpdate.forEach(filePath => {
  updatePaginationInFile(filePath);
});

console.log('\n✅ Обновление завершено!');
