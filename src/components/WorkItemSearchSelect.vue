<!-- src/components/WorkItemSearchSelect.vue
     Выбор позиции прайса для строки сметы (образец — MaterialSearchSelect). Автоподсказка по
     work-items/search (скоуп по category). Выбор существующей позиции (emit change=lite для префилла
     unit/price/kind) ИЛИ ввод новой (emit custom-item=имя → форма решает режим «б»/«в»).
     A11y: клавиатурная навигация ArrowUp/Down+Enter (F-914); без двойного fetch (F-875). -->
<template>
  <div class="form-control">
    <label v-if="label" class="label">
      <span class="label-text font-medium">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>

    <div class="relative" ref="inputContainer" style="display: flex; align-items: center;">
      <button
        class="btn btn-warning"
        :class="[
          { 'btn-error': hasError || error },
          { 'btn-xs': size === 'xs' }, { 'btn-sm': size === 'sm' },
          { 'btn-md': size === 'md' }, { 'btn-lg': size === 'lg' }
        ]"
        v-if="selectedItem && !disabled"
        type="button"
        aria-label="Очистить выбор позиции"
        title="Очистить выбор"
        @click="clearSelection"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.reject"></path>
        </svg>
      </button>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="input input-bordered w-full"
        :class="[
          { 'input-error': hasError || error }, { 'input-success': isSuccess },
          { 'input-xs': size === 'xs' }, { 'input-sm': size === 'sm' },
          { 'input-md': size === 'md' }, { 'input-lg': size === 'lg' }
        ]"
        :placeholder="placeholder || 'Начните вводить позицию…'"
        :disabled="disabled"
        @input="handleSearch"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      <div v-if="loading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <svg class="w-4 h-4 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIconPath('refresh')"></path>
        </svg>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showDropdown && (searchResults.length > 0 || searchQuery.length >= 2)"
        ref="dropdown"
        class="fixed z-50 bg-base-100 text-base-content border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        :style="dropdownStyle"
      >
        <button
          v-for="(item, iIdx) in searchResults"
          :key="item.id"
          type="button"
          class="w-full px-3 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none"
          :class="{ 'bg-primary text-primary-content': selectedItem?.id === item.id || iIdx === activeIndex }"
          @mousedown.prevent
          @mousemove="activeIndex = iIdx"
          @click="selectItem(item)"
        >
          <div class="font-medium break-words">{{ item.name }}</div>
          <div class="text-xs text-muted flex gap-2">
            <span>{{ item.kind_display }}</span>
            <span v-if="item.unit">· {{ item.unit }}</span>
            <span v-if="item.default_price">· {{ formatNumber(item.default_price) }}</span>
          </div>
        </button>

        <div v-if="searchResults.length === 0 && searchQuery.length >= 2" class="px-3 py-2 text-sm text-muted">
          Позиции не найдены
        </div>

        <!-- «Добавить «<имя>»» — завести новую позицию прямо из строки сметы (режим «б»/«в»). -->
        <button
          v-if="allowCustom && searchQuery.trim().length >= 2"
          type="button"
          class="w-full px-3 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none border-t border-base-300"
          :class="{ 'bg-primary text-primary-content': activeIndex === searchResults.length }"
          @mousedown.prevent
          @click="selectCustomItem"
        >
          <div class="font-medium text-primary flex items-center gap-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="ACTION_ICONS.add" />
            </svg>
            <span class="truncate">Добавить «{{ searchQuery.trim() }}»</span>
          </div>
        </button>
      </div>
    </Teleport>

    <div v-if="hasError || error" class="label">
      <span class="label-text-alt text-error">{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useWorkItemsStore, searchWorkItems } from '@/stores/workItems'
import type { WorkItem, WorkItemLite } from '@/api/types/estimates'
import { computeDropdownPosition } from '@/utils/dropdownPosition'
import { formatNumber } from '@/utils/formatters'
import { ACTION_ICONS } from '@/utils/actionIcons'
import { getIconPath } from '@/assets/icons'

const props = defineProps<{
  modelValue?: number | null
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  category?: number | null // скоуп поиска по подразделу B
  allowCustom?: boolean // разрешить ввод новой позиции
  isSuccess?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [item: WorkItemLite | null] // выбор существующей → префилл unit/price/kind
  'input': [query: string]
  'custom-item': [name: string] // ввод новой позиции (форма решает режим «б» по наличию category)
}>()

const workItemsStore = useWorkItemsStore()

const searchInput = ref<HTMLInputElement>()
const inputContainer = ref<HTMLElement>()
const dropdown = ref<HTMLElement>()
const searchQuery = ref('')
const searchResults = ref<WorkItemLite[]>([])
const activeIndex = ref(-1) // F-914: клавиатурная навигация
const selectedItem = ref<WorkItemLite | null>(null)
const showDropdown = ref(false)
const loading = ref(false)
const searchTimeout = ref<ReturnType<typeof setTimeout>>()
const isUserTyping = ref(false)
let searchSeq = 0 // отбрасывание устаревших (out-of-order) ответов
const positionTick = ref(0)

const hasError = computed(() => !!props.error)
const isSuccess = computed(() => !!props.isSuccess)

const dropdownStyle = computed(() => {
  void positionTick.value
  if (!searchInput.value || !showDropdown.value) { return {} }
  const pos = computeDropdownPosition(searchInput.value.getBoundingClientRect(), window.innerHeight)
  return {
    position: 'fixed' as const,
    top: `${pos.top}px`, left: `${pos.left}px`, width: `${pos.width}px`,
    maxHeight: `${pos.maxHeight}px`, zIndex: 9999,
  }
})

watch(searchQuery, (newQuery) => {
  activeIndex.value = -1
  if (searchTimeout.value) { clearTimeout(searchTimeout.value) }
  if (newQuery.length >= 2) {
    searchTimeout.value = setTimeout(() => { runSearch(newQuery) }, 300)
  } else {
    searchResults.value = []
  }
})

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedItem.value?.id) {
    loadSelectedItem(newValue)
  } else if (!newValue) {
    selectedItem.value = null
    searchQuery.value = ''
  }
}, { immediate: true })

// F-875-класс: сменили подраздел B → результаты старой категории неактуальны, чистим.
watch(() => props.category, () => {
  if (isUserTyping.value && searchQuery.value.length >= 2) { runSearch(searchQuery.value) }
})

async function runSearch(query: string) {
  if (query.length < 2) { return }
  const mySeq = ++searchSeq
  loading.value = true
  try {
    const results = await searchWorkItems(query, props.category ?? undefined, 10)
    if (mySeq !== searchSeq) { return } // гонка: пришёл более новый поиск
    searchResults.value = results
    if (isUserTyping.value) { showDropdown.value = true }
  } catch (error) {
    if (mySeq === searchSeq) { searchResults.value = [] }
  } finally {
    if (mySeq === searchSeq) { loading.value = false }
  }
}

async function loadSelectedItem(itemId: number) {
  // Программная загрузка (edit-путь): резолвим позицию из стора или fetchOne.
  try {
    const found = workItemsStore.items.find((m: WorkItem) => m.id === itemId)
    const item = found || (await workItemsStore.fetchOne(itemId))
    if (item) {
      selectedItem.value = { id: item.id, name: item.name, kind: item.kind, kind_display: (item as WorkItem).kind_display, unit: item.unit, default_price: item.default_price }
      searchQuery.value = item.name
      isUserTyping.value = false
    }
  } catch (error) {
    // позиция могла быть удалена из каталога (SET_NULL в строке) — молча оставляем как есть
  }
}

function selectItem(item: WorkItemLite) {
  selectedItem.value = item
  searchQuery.value = item.name
  showDropdown.value = false
  emit('update:modelValue', item.id)
  emit('change', item)
}

function clearSelection() {
  selectedItem.value = null
  searchQuery.value = ''
  showDropdown.value = false
  isUserTyping.value = false
  emit('update:modelValue', null)
  emit('change', null)
  nextTick(() => { searchInput.value?.focus() })
}

function handleSearch() {
  isUserTyping.value = true
  emit('input', searchQuery.value)
}

function selectCustomItem() {
  const name = searchQuery.value.trim()
  if (name.length >= 2) {
    showDropdown.value = false
    selectedItem.value = null
    emit('update:modelValue', null)
    emit('change', null)
    emit('custom-item', name)
  }
}

function handleBlur() {
  setTimeout(() => { showDropdown.value = false; isUserTyping.value = false }, 150)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    showDropdown.value = false
    isUserTyping.value = false
    searchInput.value?.blur()
    return
  }
  const customAvailable = !!props.allowCustom && searchQuery.value.trim().length >= 2
  const total = searchResults.value.length + (customAvailable ? 1 : 0)
  // F-929 (review): Enter в поле поиска НИКОГДА не должен сабмитить родительскую <form> (форма сметы —
  // <form @submit.prevent>, и Enter в единственном text-input по умолчанию сабмитил всю смету). Гасим
  // сабмит, если открыт дропдаун или есть запрос; при подсвеченном пункте — выбираем его.
  if (event.key === 'Enter') {
    if (showDropdown.value || searchQuery.value.trim().length >= 2) {
      event.preventDefault()
      if (showDropdown.value && activeIndex.value >= 0) {
        if (activeIndex.value < searchResults.value.length) {
          selectItem(searchResults.value[activeIndex.value])
        } else if (customAvailable) {
          selectCustomItem()
        }
      }
    }
    return
  }
  if (!showDropdown.value || total === 0) { return }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = activeIndex.value < total - 1 ? activeIndex.value + 1 : 0
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : total - 1
  }
}

function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!inputContainer.value?.contains(target) && !dropdown.value?.contains(target)) {
    showDropdown.value = false
    isUserTyping.value = false
  }
}

function handleReposition() {
  if (showDropdown.value) { positionTick.value++ }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleReposition)
  window.addEventListener('scroll', handleReposition, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleReposition)
  window.removeEventListener('scroll', handleReposition, true)
  if (searchTimeout.value) { clearTimeout(searchTimeout.value) }
})
</script>
