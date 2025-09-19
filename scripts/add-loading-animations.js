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

// Маппинг количества колонок для каждой страницы
const columnsMapping = {
  'src/pages/Employees/List.vue': 8,
  'src/pages/Units/List.vue': 5,
  'src/pages/Objects/List.vue': 5,
  'src/pages/Purchases/List.vue': 6,
  'src/pages/Stocks/List.vue': 7,
  'src/pages/Archive/List.vue': 6
};

// Маппинг имен stores
const storeMapping = {
  'src/pages/Employees/List.vue': 'employeesStore',
  'src/pages/Units/List.vue': 'unitsStore',
  'src/pages/Objects/List.vue': 'objectsStore',
  'src/pages/Purchases/List.vue': 'purchasesStore',
  'src/pages/Stocks/List.vue': 'stocksStore',
  'src/pages/Archive/List.vue': 'archiveStore'
};

function updatePageWithLoadingAnimations(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Файл не найден: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const storeName = storeMapping[filePath];
  const columns = columnsMapping[filePath];
  
  if (!storeName) {
    console.log(`Не найден store для файла: ${filePath}`);
    return;
  }

  let updatedContent = content;

  // 1. Добавляем импорты для компонентов загрузки
  if (!updatedContent.includes('import LoadingSpinner')) {
    const importPattern = /(import ModernPagination from '@/components\/ModernPagination\.vue')/;
    const importReplacement = `$1\nimport LoadingSpinner from '@/components/LoadingSpinner.vue'\nimport TableSkeleton from '@/components/TableSkeleton.vue'`;
    updatedContent = updatedContent.replace(importPattern, importReplacement);
  }

  // 2. Обновляем контейнер таблицы
  const listContentPattern = /(<div class="list-content">)/;
  const listContentReplacement = `<div class="list-content" :class="{ 'relative': ${storeName}.loading }">`;
  updatedContent = updatedContent.replace(listContentPattern, listContentReplacement);

  // 3. Добавляем компоненты загрузки после открытия div
  const loadingComponents = `
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="${storeName}.loading && ${storeName}.items.length === 0"
        size="lg"
        variant="primary"
        text="Загрузка данных..."
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="${storeName}.loading && ${storeName}.items.length > 0" class="loading-overlay">
        <LoadingSpinner 
          size="md"
          variant="primary"
          text="Обновление данных..."
          :overlay="true"
        />
      </div>`;

  const tablePattern = /(<table class="modern-table">)/;
  const tableReplacement = `${loadingComponents}\n\n      <table class="modern-table">`;
  updatedContent = updatedContent.replace(tablePattern, tableReplacement);

  // 4. Добавляем TableSkeleton после thead
  const skeletonComponent = `
        
        <!-- Skeleton Loading -->
        <TableSkeleton 
          v-if="${storeName}.loading && ${storeName}.items.length === 0"
          :rows="${storeName}.pagination.pageSize"
          :columns="${columns}"
        />
        
        <!-- Actual Data -->`;

  const tbodyPattern = /(<tbody>)/;
  const tbodyReplacement = `${skeletonComponent}\n        <tbody v-else>`;
  updatedContent = updatedContent.replace(tbodyPattern, tbodyReplacement);

  // 5. Обновляем строки таблицы с классом table-row
  const trPattern = /(<tr v-for="[^"]*" :key="[^"]*">)/g;
  updatedContent = updatedContent.replace(trPattern, '<tr v-for="$1" :key="$2" class="table-row">');

  // 6. Улучшаем пустое состояние
  const emptyStatePattern = /(<td colspan="[^"]*" class="text-center text-gray-500">Нет данных<\/td>)/;
  const emptyStateReplacement = `<td colspan="${columns}" class="text-center text-gray-500 py-8">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span class="text-sm">Нет данных</span>
              </div>
            </td>`;
  updatedContent = updatedContent.replace(emptyStatePattern, emptyStateReplacement);

  // 7. Добавляем CSS стили для анимаций
  const cssStyles = `

<style scoped>
/* Анимации для строк таблицы */
.table-row {
  transition: all 0.3s ease;
}

.table-row:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Overlay для загрузки */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 50;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

:root.dark .loading-overlay {
  background: rgba(15, 23, 42, 0.9);
}

/* Анимация появления строк */
.table-row {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Задержка анимации для каждой строки */
.table-row:nth-child(1) { animation-delay: 0.1s; }
.table-row:nth-child(2) { animation-delay: 0.2s; }
.table-row:nth-child(3) { animation-delay: 0.3s; }
.table-row:nth-child(4) { animation-delay: 0.4s; }
.table-row:nth-child(5) { animation-delay: 0.5s; }
</style>`;

  // Добавляем стили в конец файла, если их еще нет
  if (!updatedContent.includes('/* Анимации для строк таблицы */')) {
    updatedContent = updatedContent.replace(/<\/script>\s*$/, `</script>${cssStyles}`);
  }

  fs.writeFileSync(filePath, updatedContent);
  console.log(`✅ Обновлен: ${filePath}`);
}

// Обновляем все файлы
console.log('🔄 Добавление анимаций загрузки на все страницы...\n');

pagesToUpdate.forEach(filePath => {
  updatePageWithLoadingAnimations(filePath);
});

console.log('\n✅ Обновление завершено!');
