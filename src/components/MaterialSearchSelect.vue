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
        class="fixed z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        :style="dropdownStyle"
      >
          <!-- No results -->
          <div v-if="searchResults.length === 0 && searchQuery.length >= 2" class="p-3 text-sm text-base-content/70">
            Материалы не найдены
          </div>
          
          <!-- Results -->
          <button
            v-for="material in searchResults"
            :key="material.id"
            type="button"
            class="w-full px-3 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none"
            :class="{ 'bg-primary text-primary-content': selectedMaterial?.id === material.id }"
            @click="selectMaterial(material)"
          >
            <div class="font-medium">{{ material.name }}</div>
            <div v-if="material.category_name" class="text-xs text-base-content/60">
              {{ material.category_name }}
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
import { useMaterialsStore } from '@/stores/materials'
import type { Material } from '@/api/types/materials'
import api from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { MaterialBalance, ObjectBalance } from '@/api/types/stocks'

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
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [material: Material | null]
}>()

const materialsStore = useMaterialsStore

const searchInput = ref<HTMLInputElement>()
const inputContainer = ref<HTMLElement>()
const dropdown = ref<HTMLElement>()
const searchQuery = ref('')
const searchResults = ref<Material[]>([])
const selectedMaterial = ref<Material | null>(null)
const showDropdown = ref(false)
const loading = ref(false)
const searchTimeout = ref<NodeJS.Timeout>()
const isUserTyping = ref(false) // Флаг для отслеживания активного ввода пользователя

const hasError = computed(() => !!props.error)

// Calculate dropdown position - simplified with teleport
const dropdownStyle = computed(() => {
  if (!searchInput.value || !showDropdown.value) {
    return {}
  }
  
  const rect = searchInput.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 240 // max-h-60 = 240px
  
  // Check if there's enough space below
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  
  let top = rect.bottom + 4 // 4px gap
  let maxHeight = Math.min(dropdownHeight, spaceBelow - 8)
  
  // If not enough space below, position above
  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    top = rect.top - Math.min(dropdownHeight, spaceAbove - 8)
    maxHeight = Math.min(dropdownHeight, spaceAbove - 8)
  }
  
  return {
    position: 'fixed' as const,
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: 9999
  }
})

// Search materials when query changes
watch(searchQuery, (newQuery) => {
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
  
  loading.value = true
  try {
    let results = await materialsStore.searchMaterials(query)
    
    // Фильтруем по остаткам, если указан objectId и включена фильтрация
    if (props.filterByBalance && props.objectId && props.date) {
      try {
        // Получаем остатки для объекта на указанную дату
        const apiParams = new URLSearchParams()
        apiParams.append('object_id', String(props.objectId))
        apiParams.append('date', props.date)
        
        const response = await api.get(`${endpoints.stockSnapshots.byObjects}?${apiParams}`)
        
        // Собираем все материалы с остатками > 0
        const materialsWithBalance = new Set<number>()
        if (response.data.objects && response.data.objects.length > 0) {
          const objectData = response.data.objects[0] as ObjectBalance
          if (objectData.materials) {
            objectData.materials.forEach((material: MaterialBalance) => {
              const balance = parseFloat(material.current_balance || '0')
              if (balance > 0) {
                materialsWithBalance.add(material.material_id)
              }
            })
          }
        }
        
        // Фильтруем результаты поиска, оставляя только материалы с остатками
        results = results.filter((material: Material) => materialsWithBalance.has(material.id))
      } catch (error) {
        console.error('Error fetching balances for material filtering:', error)
        // В случае ошибки показываем все результаты поиска
      }
    }
    
    searchResults.value = results
    // Открываем dropdown только если пользователь активно печатает
    if (isUserTyping.value) {
      showDropdown.value = true
    }
  } catch (error) {
    console.error('Error searching materials:', error)
    searchResults.value = []
  } finally {
    loading.value = false
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
  // Search is handled by watch
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

// Handle window resize to recalculate position
function handleResize() {
  // Force reactivity update for dropdown position
  if (showDropdown.value) {
    showDropdown.value = false
    nextTick(() => {
      showDropdown.value = true
    })
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
  
  // Load initial material if modelValue is set
  if (props.modelValue) {
    loadSelectedMaterial(props.modelValue)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>
