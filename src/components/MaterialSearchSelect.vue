<!-- src/components/MaterialSearchSelect.vue -->
<template>
  <div class="form-control">
    <!-- Label -->
    <label v-if="label" class="label">
      <span class="label-text font-medium">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    
    <!-- Search Input -->
    <div class="relative" ref="inputContainer" style="display: flex; align-items: center;">
      <button 
        class="btn btn-warning"
        :class="[
          { 'btn-error': hasError || error },
          { 'btn-xs': size === 'xs' },
          { 'btn-sm': size === 'sm' },
          { 'btn-md': size === 'md' },
          { 'btn-lg': size === 'lg' }
        ]"
        v-if="selectedMaterial && !disabled && !loading"
        type="button"
        aria-label="Очистить выбор материала"
        title="Очистить выбор"
        @click="clearSelection"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        class="input input-bordered w-full"
        :class="[
          { 'input-error': hasError || error },
          { 'input-success': isSuccess },
          { 'input-xs': size === 'xs' },
          { 'input-sm': size === 'sm' },
          { 'input-md': size === 'md' },
          { 'input-lg': size === 'lg' }
        ]"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="handleSearch"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />
      
      <!-- Loading indicator -->
      <div v-if="loading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <svg class="w-4 h-4 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      

    </div>
    
    <!-- Dropdown - rendered in body using teleport -->
    <Teleport to="body">
      <div
        v-if="showDropdown && (searchResults.length > 0 || searchQuery.length >= 2)"
        ref="dropdown"
        class="fixed z-50 bg-base-100 text-base-content border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        :style="dropdownStyle"
      >
          <!-- Results -->
          <button
            v-for="(material, mIdx) in searchResults"
            :key="material.id"
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none"
            :class="{ 'bg-primary text-primary-content': selectedMaterial?.id === material.id || mIdx === activeIndex }"
            @mousedown.prevent
            @mousemove="activeIndex = mIdx"
            @click="selectMaterial(material)"
          >
            <div class="font-medium">{{ material.name }}</div>
            <div v-if="material.category_name" class="text-xs text-muted">
              {{ material.category_name }}
            </div>
          </button>

          <!-- Нет совпадений — подсказка -->
          <div v-if="searchResults.length === 0 && searchQuery.length >= 2" class="px-3 py-2 text-sm text-muted">
            Материалы не найдены
          </div>

          <!-- F-594: «Создать «<имя>»» ВСЕГДА доступно при вводе ≥2 симв. (а не только при 0 совпадений),
               чтобы завести новый материал прямо из позиции, даже если имя частично совпадает с
               существующим — не заходя в отдельный раздел «Материалы». Показываем введённое имя. -->
          <button
            v-if="allowCustom && searchQuery.trim().length >= 2"
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none border-t border-base-300"
            :class="{ 'bg-primary text-primary-content': activeIndex === searchResults.length }"
            @mousedown.prevent
            @click="selectCustomMaterial"
          >
            <div class="font-medium text-primary flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span class="truncate">Создать «{{ searchQuery.trim() }}»</span>
            </div>
          </button>
      </div>
    </Teleport>
    
    <!-- Error message -->
    <div v-if="hasError || error" class="label">
      <span class="label-text-alt text-error">{{ error }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useMaterialsStore, getMaterialsInStock } from '@/stores/materials'
import type { Material } from '@/api/types/materials'
import { computeDropdownPosition, getVisualViewportBounds } from '@/utils/dropdownPosition'

const props = defineProps<{
  modelValue?: number | null
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  objectId?: number | null // ID объекта для фильтрации по остаткам
  date?: string | null // Дата для проверки остатков
  filterByBalance?: boolean // Фильтровать только материалы с остатками > 0
  excludeMaterials?: number[] // Исключить материалы из списка (уже добавленные в форму)
  allowCustom?: boolean // Разрешить ввод произвольного текста (для создания новых материалов)
  isSuccess?: boolean // Показать успешное состояние (зеленая обводка)
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [material: Material | null]
  'input': [query: string] // Событие при вводе текста
  'custom-material': [materialName: string] // Событие при вводе нового материала
}>()

const materialsStore = useMaterialsStore()

const searchInput = ref<HTMLInputElement>()
const inputContainer = ref<HTMLElement>()
const dropdown = ref<HTMLElement>()
const searchQuery = ref('')
const searchResults = ref<Material[]>([])
const activeIndex = ref(-1)  // F-914: активный пункт для клавиатурной навигации (ArrowUp/Down + Enter)
const selectedMaterial = ref<Material | null>(null)
const showDropdown = ref(false)
const loading = ref(false)
const searchTimeout = ref<NodeJS.Timeout>()
const isUserTyping = ref(false) // Флаг для отслеживания активного ввода пользователя
let searchSeq = 0 // токен для отбрасывания устаревших (out-of-order) ответов поиска
// F-518: реактивный «тик» пересчёта позиции. dropdownStyle кэшируется и не реагирует на
// getBoundingClientRect сам по себе — при скролле/resize инкрементируем тик, чтобы меню
// пересчитало координаты без грубого off/on-моргания.
const positionTick = ref(0)

const hasError = computed(() => !!props.error)
const isSuccess = computed(() => !!props.isSuccess)

// Calculate dropdown position - simplified with teleport
const dropdownStyle = computed(() => {
  void positionTick.value // F-518: dep — пересчёт при скролле/resize
  if (!searchInput.value || !showDropdown.value) {
    return {}
  }

  // F-518: расчёт вынесен в чистую computeDropdownPosition (см. utils/dropdownPosition.ts) —
  // по умолчанию меню открывается ПОД полем и лишь ограничивает высоту; вверх откидывается,
  // только когда снизу реально мало места. Раньше улетало вверх при любом < 240px снизу.
  const pos = computeDropdownPosition(searchInput.value.getBoundingClientRect(), getVisualViewportBounds())

  return {
    position: 'fixed' as const,
    top: `${pos.top}px`,
    left: `${pos.left}px`,
    width: `${pos.width}px`,
    maxHeight: `${pos.maxHeight}px`,
    zIndex: 9999
  }
})

// Search materials when query changes
watch(searchQuery, (newQuery) => {
  activeIndex.value = -1  // F-914: новый ввод → сбрасываем активный пункт клавиатурной навигации
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  if (newQuery.length >= 2) {
    searchTimeout.value = setTimeout(() => {
      searchMaterials(newQuery)
    }, 300) // Debounce search
  } else {
    searchResults.value = []
    // Не закрываем dropdown сразу, если пользователь активно печатает
    // showDropdown.value = false
  }
})

// Watch for external modelValue changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedMaterial.value?.id) {
    loadSelectedMaterial(newValue)
  } else if (!newValue) {
    selectedMaterial.value = null
    searchQuery.value = ''
  }
}, { immediate: true })

async function searchMaterials(query: string) {
  if (query.length < 2) {return}

  const mySeq = ++searchSeq
  loading.value = true
  try {
    let results = await materialsStore.search(query)

    // Фильтруем исключённые материалы (уже добавленные в форму)
    if (props.excludeMaterials && props.excludeMaterials.length > 0) {
      results = results.filter((material: Material) => !props.excludeMaterials!.includes(material.id))
    }

    // Фильтруем по остаткам, если указан objectId и включена фильтрация.
    // Единый источник «что в наличии» — getMaterialsInStock (тот же by-objects контракт,
    // что и форма «Внести остатки»), чтобы логика фильтра нигде не расходилась. При сбое
    // by-objects — fail-open: показываем результаты поиска как есть (иначе сбой выглядел бы
    // как «ничего не найдено» и полностью блокировал бы выбор материала).
    if (props.filterByBalance && props.objectId && props.date) {
      try {
        const inStock = await getMaterialsInStock(props.objectId, props.date)
        const idsWithBalance = new Set(inStock.map(m => m.material_id))
        results = results.filter((material: Material) => idsWithBalance.has(material.id))
      } catch (error) {
        console.error('Error fetching balances for material filtering:', error)
      }
    }

    // Гонка: пока шли запросы, пользователь мог начать более новый поиск — не затираем свежий.
    if (mySeq !== searchSeq) { return }
    searchResults.value = results
    // Открываем dropdown только если пользователь активно печатает
    if (isUserTyping.value) {
      showDropdown.value = true
    }
  } catch (error) {
    console.error('Error searching materials:', error)
    if (mySeq === searchSeq) { searchResults.value = [] }
  } finally {
    if (mySeq === searchSeq) { loading.value = false }
  }
}

async function loadSelectedMaterial(materialId: number) {
  try {
    const material = materialsStore.items.find(m => m.id === materialId)
    if (material) {
      selectedMaterial.value = material
      searchQuery.value = material.name
      // Сбрасываем флаг активного ввода при программной загрузке материала
      isUserTyping.value = false
    } else {
      // If material not in store, try to fetch it
      await materialsStore.fetchOne(materialId)
      const fetchedMaterial = materialsStore.items.find(m => m.id === materialId)
      if (fetchedMaterial) {
        selectedMaterial.value = fetchedMaterial
        searchQuery.value = fetchedMaterial.name
        // Сбрасываем флаг активного ввода при программной загрузке материала
        isUserTyping.value = false
      }
    }
  } catch (error) {
    console.error('Error loading material:', error)
  }
}

function selectMaterial(material: Material) {
  selectedMaterial.value = material
  searchQuery.value = material.name
  showDropdown.value = false
  
  emit('update:modelValue', material.id)
  emit('change', material)
}

function clearSelection() {
  selectedMaterial.value = null
  searchQuery.value = ''
  showDropdown.value = false
  isUserTyping.value = false // Сбрасываем флаг активного ввода
  
  emit('update:modelValue', null)
  emit('change', null)
  
  nextTick(() => {
    searchInput.value?.focus()
  })
}

function handleSearch() {
  // Устанавливаем флаг активного ввода пользователя
  isUserTyping.value = true
  // Emit input event для отслеживания ввода текста
  emit('input', searchQuery.value)
  // Search is handled by watch
}

function selectCustomMaterial() {
  // Пользователь выбрал создать новый материал
  const materialName = searchQuery.value.trim()
  if (materialName.length >= 2) {
    showDropdown.value = false
    selectedMaterial.value = null
    emit('update:modelValue', null)
    emit('change', null)
    emit('custom-material', materialName)
  }
}

function handleFocus() {
  // Не открываем dropdown автоматически при фокусе
  // Пользователь должен начать печатать, чтобы увидеть результаты
  // if (searchQuery.value.length >= 2) {
  //   showDropdown.value = true
  // }
}

function handleBlur() {
  // Delay hiding dropdown to allow clicks on options
  setTimeout(() => {
    showDropdown.value = false
    isUserTyping.value = false // Сбрасываем флаг при потере фокуса
  }, 150)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    showDropdown.value = false
    isUserTyping.value = false // Сбрасываем флаг при нажатии Escape
    searchInput.value?.blur()
    return
  }
  // F-914 (a11y): раньше выбрать результат с клавиатуры было НЕЛЬЗЯ — TAB к кнопкам-результатам ронял
  // blur input → handleBlur закрывал dropdown раньше активации (блокировало ввод позиций закупки/
  // списания с клавиатуры). Ведём активный индекс прямо в поле: ArrowDown/Up перемещают, Enter выбирает
  // (последний виртуальный пункт — «создать материал», если allowCustom и ввод ≥2 симв.).
  const customAvailable = !!props.allowCustom && searchQuery.value.trim().length >= 2
  const total = searchResults.value.length + (customAvailable ? 1 : 0)
  if (!showDropdown.value || total === 0) { return }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = activeIndex.value < total - 1 ? activeIndex.value + 1 : 0
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = activeIndex.value > 0 ? activeIndex.value - 1 : total - 1
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    if (activeIndex.value < searchResults.value.length) {
      selectMaterial(searchResults.value[activeIndex.value])
    } else if (customAvailable) {
      selectCustomMaterial()
    }
  }
}

// Click outside to close dropdown
function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement
  if (!inputContainer.value?.contains(target) && !dropdown.value?.contains(target)) {
    showDropdown.value = false
    isUserTyping.value = false // Сбрасываем флаг при закрытии dropdown
  }
}

// F-518: пересчёт позиции при скролле/resize — просто инкремент тика (dropdownStyle
// подхватит и пересчитает getBoundingClientRect). Без off/on-моргания, как было раньше.
function handleReposition() {
  if (showDropdown.value) {
    positionTick.value++
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleReposition)
  // F-1000: iOS-клавиатура/pinch-zoom меняют ТОЛЬКО visualViewport (window.resize не стреляет)
  window.visualViewport?.addEventListener('resize', handleReposition)
  window.visualViewport?.addEventListener('scroll', handleReposition)
  // capture:true — ловим скролл ЛЮБОГО контейнера (тело модалки скроллится и не поднимает
  // событие до window без capture), иначе меню «отрывалось» от поля при прокрутке формы.
  window.addEventListener('scroll', handleReposition, true)
  // F-875: начальную загрузку материала НЕ дублируем здесь — её уже делает watcher modelValue с
  // immediate:true (см. выше). Раньше onMounted звал loadSelectedMaterial повторно → два одинаковых
  // GET /materials/:id при монтировании формы с непрокэшированным материалом (fetchOne без dedup).
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleReposition)
  window.visualViewport?.removeEventListener('resize', handleReposition)
  window.visualViewport?.removeEventListener('scroll', handleReposition)
  window.removeEventListener('scroll', handleReposition, true)
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>
