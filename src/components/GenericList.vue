<template>
  <div class="list-container">
    <!-- Header -->
    <ListHeader
      :title="config.title"
      :subtitle="config.subtitle"
      :icon="config.icon"
      :show-create="config.showCreate && canCreate"
      :create-text="config.createText"
      :can-create="canCreate"
      :loading="store.loading"
      :show-stats="config.showStats"
      :total-count="store.pagination?.count || 0"
      :filtered-count="store.items?.length || 0"
      @create="$emit('create')"
    >
      <template #actions>
        <!-- ✅ RBAC: Проверка разрешения на экспорт -->
        <ExportButton 
          v-if="config.exportable && canExport"
          :data="store.items"
          :filename="config.exportFilename"
          :loading="store.loading"
          @export="handleExport"
        />
        <slot name="header-actions" />
      </template>
    </ListHeader>

    <!-- Filters -->
    <FilterPanel
      v-if="config.filters && config.filters.length > 0"
      :columns="config.filterColumns || 3"
      :loading="store.loading"
      @reset="handleResetFilters"
    >
      <FilterField
        v-for="filter in config.filters"
        :key="filter.key"
        :model-value="store.filters?.[filter.key] || ''"
        :type="filter.type"
        :label="filter.label"
        :placeholder="filter.placeholder"
        :options="filter.options"
        :required="filter.required"
        @update:model-value="(value) => updateFilter(filter.key, value)"
      />
    </FilterPanel>

    <!-- Error message -->
    <div v-if="store.error" class="alert alert-error">
      <span>{{ store.error }}</span>
      <button class="btn btn-sm btn-ghost" @click="store.clearError()">×</button>
    </div>

    <!-- Table/Cards -->
    <div class="list-content" :class="{ 'relative': store.loading, 'mobile-cards-wrapper': isMobile }">
      <!-- Loading Overlay -->
      <LoadingSpinner 
        v-if="store.loading && store.items.length === 0"
        size="lg"
        variant="primary"
        :text="config.loadingText || 'Загрузка данных...'"
        :overlay="false"
      />
      
      <!-- Loading Skeleton for existing data -->
      <div v-if="store.loading && store.items.length > 0" class="loading-overlay">
        <LoadingSpinner 
          size="md"
          variant="primary"
          text="Обновление данных..."
          :overlay="true"
        />
      </div>

      <!-- Desktop: Table View -->
      <div v-if="!isMobile" class="table-container desktop-only">
        <table class="modern-table" role="table" aria-label="Data table">
          <thead>
            <tr>
              <th 
                v-for="column in config.columns" 
                :key="column.key"
                :class="[
                  'cursor-pointer hover:bg-base-200',
                  column.sortable !== false ? '' : 'cursor-default',
                  colAlign(column)
                ]"
                @click="column.sortable !== false ? handleSort(column.sortKey || column.key) : null"
              >
                {{ column.label }}
                <span v-if="column.sortable !== false && sortBy === (column.sortKey || column.key)" class="ml-1">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th v-if="visibleActions.length > 0" class="text-right">Действия</th>
            </tr>
          </thead>
          
          <!-- Skeleton Loading -->
          <TableSkeleton 
            v-if="store.loading && store.items.length === 0"
            :rows="store.pagination.pageSize"
            :columns="config.columns.length + (visibleActions.length > 0 ? 1 : 0)"
          />
          
          <!-- Actual Data -->
          <tbody v-else>
            <template v-for="item in store.items" :key="item.id">
              <tr >
                <td
                  v-for="column in config.columns"
                  :key="column.key"
                  :class="[
                    colAlign(column),
                    isMonoColumn(column) ? 'font-mono' : ''
                  ]"
                >
                  <slot
                    :name="`column-${column.key}`"
                    :item="item" 
                    :value="getColumnValue(item, column)"
                  >
                    <component 
                      v-if="column.component"
                      :is="column.component"
                      :item="item"
                      :value="getColumnValue(item, column)"
                    />
                        <span v-else>{{ formatColumnValue(getColumnValue(item, column), column, item) }}</span>
                  </slot>
                </td>
                <td v-if="visibleActions.length > 0" class="text-right">
                  <div class="flex gap-1 justify-end">
                    <template 
                      v-for="action in visibleActions"
                      :key="action.key"
                    >
                      <button
                        v-if="canPerformActionOnItem(action, item, config, permissions)"
                        :class="[
                          'btn',
                          actionIconPath(action)
                            ? ['btn-square row-action-btn', actionBtnClass(action)]
                            : ['btn-sm', action.class || 'btn-outline'],
                          action.disabled && action.disabled(item) ? 'btn-disabled' : ''
                        ]"
                        :disabled="action.disabled && action.disabled(item)"
                        :title="actionTitle(action, item)"
                        :aria-label="actionTitle(action, item)"
                        @click="handleAction(action.key, item)"
                      >
                        <!-- F-566/F-569: типовые действия — иконкой (компактно на узких desktop);
                             F-569: без обводки (btn-ghost), крупнее (w-5) и с семантическим цветом —
                             owner: outline избыточна, иконки были мелкие/бледные. Label в title/aria.
                             Нестандартные действия — текстом как раньше. -->
                        <!-- Размер иконки задаётся .row-action-btn svg (адаптивно, F-569). -->
                        <svg v-if="actionIconPath(action)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="actionIconPath(action)" />
                        </svg>
                        <span v-else>{{ action.label }}</span>
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
              <!-- Expanded row slot -->
              <slot name="row-expanded" :item="item" />
            </template>
            <tr v-if="!store.loading && store.items.length === 0">
              <td :colspan="config.columns.length + (visibleActions.length > 0 ? 1 : 0)" class="text-center text-muted py-4 md:py-8">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-12 h-12 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <span class="text-sm">{{ config.emptyText || 'Нет данных' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Mobile: Cards View -->
      <template v-else>
        <!-- F-593: сортировка на мобиле — паритет с сортируемыми колонками desktop (у карточек
             нет кликабельных заголовков). Поле + переключатель направления, тот же handleSort. -->
        <div v-if="sortableColumns.length > 0" class="mobile-sort">
          <svg class="mobile-sort-ico" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4 4m0 0l4-4m-4 4V4" />
          </svg>
          <select class="mobile-sort-select" :value="sortBy" @change="onMobileSortField(($event.target as HTMLSelectElement).value)">
            <option value="">Без сортировки</option>
            <option v-for="col in sortableColumns" :key="col.key" :value="col.sortKey || col.key">{{ col.label }}</option>
          </select>
          <button
            v-if="sortBy"
            type="button"
            class="mobile-sort-dir"
            :title="sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'"
            :aria-label="sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'"
            @click="handleSort(sortBy)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="sortOrder === 'asc'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <template v-if="store.items.length > 0">
          <component
            v-for="(item, index) in store.items"
            :key="item.id"
            :ref="(el: any) => setCardRef(index, el)"
            :is="config.mobileCardComponent"
            v-bind="{[config.mobileCardProp || 'item']: item}" as any
            :actions="getCardActions(item)"
            @action="handleCardAction(item, $event)"
            class="mobile-only"
            v-show="isCardVisible(index)"
          />
        </template>
        
        <!-- Empty State для мобильных -->
        <div v-else class="mobile-only flex flex-col items-center gap-2 md:gap-4 py-6 md:py-12 text-center">
        <svg class="w-16 h-16 text-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <div>
          <h3 class="text-lg font-medium text-base-content mb-1">{{ config.emptyTitle || 'Нет данных' }}</h3>
          <p class="text-muted">{{ config.emptySubtitle || 'Создайте первый элемент для начала работы' }}</p>
        </div>
        <button
          v-if="config.showCreate && canCreate"
          class="btn btn-primary"
          @click="$emit('create')"
        >
          {{ config.createText || 'Создать' }}
        </button>
      </div>
      </template>
    </div>

    <!-- Pagination -->
    <ModernPagination
      :current-page="store.pagination.page"
      :total-pages="calculateTotalPages()"
      :total-items="store.pagination.count"
      :page-size="store.pagination.pageSize"
      :actual-items-count="store.items.length"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useResponsiveTable } from '@/composables/useResponsiveTable'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { usePermissions } from '@/composables/usePermissions'
import { useUrlFilters } from '@/composables/useUrlFilters'
import { exportToCSV, exportToExcel, exportFromBackend } from '@/utils/export'
import { isMobileDevice } from '@/utils/device'
import { actionIconPath, actionBtnClass } from '@/utils/actionIcons'
import { formatDate } from '@/utils/formatters'
import { filterActionsByPermissions, getListPermissions, canPerformActionOnItem } from '@/utils/permissions'
import type {
  GenericListConfig,
  ColumnConfig,
  ActionConfig
} from '@/types/generic'

// Components
import ListHeader from './ListHeader.vue'
import FilterPanel from './FilterPanel.vue'
import FilterField from './FilterField.vue'
import ModernPagination from './ModernPagination.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ExportButton from './ExportButton.vue'
import TableSkeleton from './TableSkeleton.vue'

// Types imported from @/types/generic

// Props
interface Props {
  store: any // Store с методами fetchList, pagination, filters, etc.
  config: GenericListConfig
}

const props = defineProps<Props>()

// F-506: единая синхронизация «URL ↔ фильтры/сортировка/страница».
// GenericList — единственная точка, через которую идут все списочные экраны, поэтому
// deep-link, обратная запись в URL и «назад/вперёд» чинятся здесь один раз для всех.
// Вызов ДО onMounted страницы: значения из URL попадают в store.filters до первого fetchList.
useUrlFilters(props.store, () => props.config.filters)

// Emits
const emit = defineEmits<{
  create: []
  action: [action: string, item: any]
  export: [format: 'csv' | 'excel']
}>()

// Composables
const { isMobile } = useResponsiveTable()
const { handleExportError } = useErrorHandler()
const permissions = usePermissions()

// ✅ RBAC: Фильтрованные действия на основе permissions
const visibleActions = computed(() => {
  if (!props.config.actions || props.config.actions.length === 0) {
    return []
  }
  
  return filterActionsByPermissions(props.config.actions, props.config, permissions)
})

// State
const sortBy = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// ✅ RBAC: Проверка разрешения на экспорт
const canExport = computed(() => {
  const listPermissions = getListPermissions(props.config)
  if (listPermissions.export) {
    return permissions.hasPermission(listPermissions.export)
  }
  // Если нет явного разрешения, проверяем общее разрешение на экспорт
  return permissions.canExportReports.value
})

// ✅ RBAC: Проверка разрешения на создание
const canCreate = computed(() => {
  // F-517: одно действие может покрываться разными правами (напр. purchases.create ИЛИ
  // purchases.create_request у роли «Заявитель» — бэкенд на POST принимает оба). Если список
  // задал createPermissionAny явно, кнопку показываем при наличии ЛЮБОГО из них. Иначе —
  // прежняя логика по одиночному {resource}.create, поведение остальных списков не меняется.
  if (props.config.createPermissionAny?.length) {
    return permissions.hasAnyPermission(...props.config.createPermissionAny)
  }
  const listPermissions = getListPermissions(props.config)
  if (listPermissions.create) {
    return permissions.hasPermission(listPermissions.create)
  }
  // Если нет явного разрешения, используем config.canCreate
  return props.config.canCreate ?? false
})

// Lazy loading для мобильных карточек
const visibleCards = ref<Set<number>>(new Set())
const cardRefs = ref<Map<number, HTMLElement>>(new Map())
let cardObserver: IntersectionObserver | null = null

// Инициализация lazy loading для карточек
const initCardLazyLoad = () => {
  // На десктопе не используем lazy loading
  if (!isMobileDevice()) {
    // Помечаем все карточки как видимые
    props.store.items.forEach((_: any, index: number) => {
      visibleCards.value.add(index)
    })
    return
  }

  // На мобильных: сначала помечаем все элементы как видимые для корректного отображения
  // Lazy loading используется только для оптимизации прокрутки
  props.store.items.forEach((_: any, index: number) => {
    visibleCards.value.add(index)
  })

  // Создаем Intersection Observer для оптимизации (предзагрузка)
  cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-card-index') || '-1', 10)
        if (index >= 0 && entry.isIntersecting) {
          visibleCards.value.add(index)
          // Отключаем observer для этого элемента после первого появления
          if (cardObserver) {
            cardObserver.unobserve(entry.target)
          }
        }
      })
    },
    {
      rootMargin: '100px', // Предзагрузка за 100px до появления
      threshold: 0.1
    }
  )

  // Наблюдаем за всеми карточками
  cardRefs.value.forEach((element, index) => {
    element.setAttribute('data-card-index', index.toString())
    cardObserver?.observe(element)
  })
}

const setCardRef = (index: number, el: any) => {
  if (el && el.$el) {
    const element = el.$el as HTMLElement
    cardRefs.value.set(index, element)
    element.setAttribute('data-card-index', index.toString())
    if (cardObserver) {
      cardObserver.observe(element)
    }
  } else if (el) {
    // Если это уже HTMLElement
    cardRefs.value.set(index, el as HTMLElement)
    el.setAttribute('data-card-index', index.toString())
    if (cardObserver) {
      cardObserver.observe(el)
    }
  }
}

const isCardVisible = (index: number): boolean => {
  // На десктопе всегда видимые
  if (!isMobileDevice()) {
    return true
  }
  // На мобильных: показываем все элементы, которые есть в списке
  // visibleCards заполняется при инициализации всеми элементами
  return visibleCards.value.has(index) || index < props.store.items.length
}

// D-020: данные (кол-во/цена/id/дата/№/артикул/остаток) — моноширинным (как кабельный журнал).
// Явный флаг mono, или правое выравнивание (числовые), или ключ-данные по шаблону.
// F-566: иконки для типовых строковых действий (edit/delete/view/open/issue/return).
// Компактные кнопки-иконки на узких desktop; текст остаётся в title/aria (доступность).
// Нестандартный action без иконки рендерится текстом как раньше. Явный action.iconPath приоритетен.
// F-584: карта иконок/классов действий вынесена в @/utils/actionIcons (общая с MobileCard,
// чтобы мобильные карточки рисовали те же чипы). actionIconPath/actionBtnClass импортированы выше.

const MONO_KEY_RE = /^(id|date|created_at|updated_at|closed_at|month|quantity|quantity_signed|qty|price|amount|total|sum|sku|purchase_no|invoice_number|inventory_number|code|balance|current_balance|current_stock|target_balance|expires_at|assigned_at)$/i
function isMonoColumn(column: ColumnConfig): boolean {
  return !!column.mono || column.align === 'right' || MONO_KEY_RE.test(column.key)
}
// Единое выравнивание: заголовок и ячейки одного столбца ВСЕГДА на одной оси.
// Правило (DESIGN_LANGUAGE: «right-aligned numbers»): ЧИСЛА/№/суммы/остатки/id — по
// правому краю; текст, ДАТЫ и коды — по левому (даты консистентно левые везде, как в
// бесшовных таблицах ArchivePeriods); center — по центру. Явный align в конфиге приоритетен.
const RIGHT_ALIGN_KEY_RE = /^(id|quantity|quantity_signed|qty|price|amount|total|sum|balance|current_balance|current_stock|target_balance|purchase_no|invoice_number|inventory_number)$/i
function colAlign(column: ColumnConfig): string {
  if (column.align === 'center') { return 'text-center' }
  if (column.align === 'right') { return 'text-right' }
  if (column.align === 'left') { return 'text-left' }
  if (RIGHT_ALIGN_KEY_RE.test(column.key)) { return 'text-right' }
  return 'text-left'
}

// A11y (F-638): title/aria-label иконочной кнопки-действия. Когда действие ЗАБЛОКИРОВАНО и задан
// disabledTooltip — отдаём причину недоступности (иначе скринридер слышит лишь «Одобрить» без
// объяснения, почему кнопка погашена).
function actionTitle(action: ActionConfig, item: any): string {
  if (action.disabled && action.disabled(item) && action.disabledTooltip) {
    return typeof action.disabledTooltip === 'function' ? action.disabledTooltip(item) : action.disabledTooltip
  }
  return action.label
}

// Methods
function getColumnValue(item: any, column: ColumnConfig) {
  // Если есть displayKey, используем его для отображения, но key для сортировки
  const displayKey = (column as any).displayKey || column.key
  if (column.path) {
    return column.path.split('.').reduce((obj, key) => obj?.[key], item)
  }
  return item[displayKey]
}

// UI-C6 (F-587): date-колонки без своего formatter раньше падали в String(value) и рендерили
// СЫРОЙ ISO («2026-01-10T01:18:…+05:00»). Класс-фикс: авто-formatDate для date-ключей с ISO-значением
// (покрывает Categories.created_at, Tools/Issues.issued_at и любые будущие date-колонки). Явный
// column.formatter всегда в приоритете.
const DATE_COL_KEY_RE = /^(created_at|updated_at|closed_at|reopened_at|issued_at|returned_at|assigned_at|expires_at|date|start_date|end_date|invoice_date)$/i
function formatColumnValue(value: any, column: ColumnConfig, item: any) {
  if (column.formatter) {
    return column.formatter(value, item)
  }
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'string' && DATE_COL_KEY_RE.test(column.key) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return formatDate(value)
  }
  return String(value)
}

async function handleSort(key: string) {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }
  
  const ordering = sortOrder.value === 'desc' ? `-${key}` : key
  await props.store.setFilters({ ordering })
}

// F-593: сортировка на мобиле — те же сортируемые колонки, что и в desktop-таблице.
const sortableColumns = computed(() => (props.config.columns || []).filter((c) => c.sortable !== false))
function onMobileSortField(key: string) {
  if (!key) {
    // «Без сортировки» — сброс к дефолту
    sortBy.value = ''
    sortOrder.value = 'asc'
    props.store.setFilters({ ordering: '' })
    return
  }
  if (key !== sortBy.value) { handleSort(key) }  // новая колонка → asc + перезагрузка
}

// Расчет общего количества страниц с учетом фактического количества элементов
function calculateTotalPages(): number {
  const { count, pageSize } = props.store.pagination
  const actualItemsCount = props.store.items.length
  
  // Если все элементы помещаются на одной странице, возвращаем 1
  if (actualItemsCount >= count) {
    return 1
  }
  
  // Иначе используем стандартный расчет
  return Math.ceil(count / pageSize)
}

async function handlePageChange(page: number) {
  await props.store.setPage(page)
}

async function handlePageSizeChange(size: number) {
  await props.store.setPageSize(size)
}

function handleAction(action: string, item: any) {
  emit('action', action, item)
}

function getCardActions(item: any) {
  if (visibleActions.value.length === 0) { return [] }
  
  return visibleActions.value
    .filter(action => {
      // ✅ RBAC: Проверка прав на конкретный элемент (с учетом scope-based permissions)
      return canPerformActionOnItem(action, item, props.config, permissions)
    })
    .map(action => ({
      key: action.key,
      label: action.label,
      shortLabel: action.label.substring(0, 4),
      class: action.class || 'btn-outline',
      disabled: action.disabled ? action.disabled(item) : false
    }))
}

function handleCardAction(item: any, action: string) {
  handleAction(action, item)
}

async function handleExport(format: 'csv' | 'excel') {
  try {
    const filename = `${props.config.exportFilename || 'data'}_${new Date().toISOString().split('T')[0]}`

    // F-866: и CSV, и Excel идут через БЭКЕНД (полные данные + русские заголовки из export_fields).
    // Локальный фолбэк (store.items = только текущая страница, сырые англ. ключи) — лишь если у
    // списка нет exportUrl.
    if (props.config.exportUrl && (format === 'excel' || format === 'csv')) {
      const backendFormat = format === 'excel' ? 'xlsx' : 'csv'
      await exportFromBackend(
        props.config.exportUrl,
        backendFormat,
        filename,
        props.store.filters
      )
    } else {
      const data = props.store.items
      if (format === 'csv') { exportToCSV(data, filename) }
      else if (format === 'excel') { exportToExcel(data, filename) }
    }

    emit('export', format)
  } catch (error) {
    await handleExportError(error, props.config.title.toLowerCase())
  }
}

// Update filter value
async function updateFilter(key: string, value: any) {
  await props.store.setFilters({ [key]: value })
  // setFilters уже вызывает fetchList(), поэтому дополнительная загрузка не нужна
}

// Reset filters
async function handleResetFilters() {
  await props.store.resetFilters()
  // resetFilters уже вызывает fetchList(), поэтому дополнительная загрузка не нужна
}

// Убрали watch на filters, так как setFilters и resetFilters уже вызывают fetchList()
// Это предотвращает двойную загрузку данных при изменении фильтров

// Инициализация lazy loading при монтировании
onMounted(() => {
  // Небольшая задержка для обеспечения готовности DOM
  setTimeout(() => {
    initCardLazyLoad()
  }, 100)
  
  // Обновляем observer при изменении списка
  watch(() => props.store.items, () => {
    // Сразу помечаем все элементы как видимые
    if (isMobileDevice()) {
      props.store.items.forEach((_: any, index: number) => {
        visibleCards.value.add(index)
      })
    }
    
    if (cardObserver) {
      // Очищаем старые наблюдения
      cardRefs.value.forEach((element) => {
        cardObserver?.unobserve(element)
      })
      cardRefs.value.clear()
      
      // Пересоздаем observer для новых элементов
      setTimeout(() => {
        initCardLazyLoad()
      }, 100)
    } else {
      // Если observer еще не создан, инициализируем его
      setTimeout(() => {
        initCardLazyLoad()
      }, 100)
    }
  }, { deep: true })
})

// Очистка observer при размонтировании
onUnmounted(() => {
  if (cardObserver) {
    cardRefs.value.forEach((element) => {
      cardObserver?.unobserve(element)
    })
    cardObserver = null
  }
})



</script>

<style scoped>
/* F-593: панель сортировки на мобиле (карточный вид). Компактная, липкая сверху не делаем —
   просто над списком. Тач-цели ≥44 (min-height). */
.mobile-sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.25rem 0.75rem;
}
.mobile-sort-ico {
  width: 1.25rem;
  height: 1.25rem;
  color: hsl(var(--tx-2));
  flex-shrink: 0;
}
.mobile-sort-select {
  flex: 1;
  min-height: 44px;
  padding: 0 0.75rem;
  border: 1px solid hsl(var(--control-border));
  border-radius: 0.5rem;
  background: hsl(var(--b1));
  color: hsl(var(--bc));
  font-size: 1rem; /* F-865 (mobile-audit): было 0.9375rem (15px) → iOS зумит при фокусе; 16px не зумит */
}
.mobile-sort-dir {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border: 1px solid hsl(var(--control-border));
  border-radius: 0.5rem;
  background: hsl(var(--b1));
  color: hsl(var(--p-text));
}
.mobile-sort-dir:hover {
  border-color: hsl(var(--p));
  background: hsl(var(--b2));
}
</style>
