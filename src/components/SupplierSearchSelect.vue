<!-- src/components/SupplierSearchSelect.vue -->
<template>
  <div class="form-control">
    <!-- Label -->
    <label v-if="label" class="label">
      <span class="label-text font-medium">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    
    <!-- Search Input -->
    <div class="relative" ref="inputContainer" style="display: flex; align-items: center;">
      <!-- Clear button -->
      <button 
        class="btn btn-warning btn-sm right-3"
        v-if="selectedSupplier && !disabled && !loading"
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
          Поставщики не найдены
        </div>
        
        <!-- Results -->
        <button
          v-for="supplier in searchResults"
          :key="supplier.id"
          type="button"
          class="w-full px-3 py-2 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none"
          :class="{ 'bg-primary text-primary-content': selectedSupplier?.id === supplier.id }"
          @click="selectSupplier(supplier)"
        >
          <div class="font-medium">{{ supplier.name }}</div>
          <div v-if="supplier.contact_person" class="text-xs text-base-content/60">
            {{ supplier.contact_person }}
          </div>
          <div v-if="supplier.phone" class="text-xs text-base-content/60">
            {{ supplier.phone }}
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
import { useSuppliersStore } from '@/stores/suppliers'
import { debounce } from '@/utils/debounce'
import type { PurchaseSupplier } from '@/api/types'

const props = defineProps<{
  modelValue?: number | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'change': [supplier: PurchaseSupplier | null]
}>()

const suppliersStore = useSuppliersStore()

// Reactive state
const searchQuery = ref('')
const searchResults = ref<PurchaseSupplier[]>([])
const selectedSupplier = ref<PurchaseSupplier | null>(null)
const showDropdown = ref(false)
const loading = ref(false)
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Refs
const searchInput = ref<HTMLInputElement>()
const dropdown = ref<HTMLDivElement>()
const inputContainer = ref<HTMLDivElement>()

// Computed
const hasError = computed(() => !!props.error)

const dropdownStyle = computed(() => {
  if (!inputContainer.value) return {}
  
  const rect = inputContainer.value.getBoundingClientRect()
  return {
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`
  }
})

// Debounced search function
const debouncedSearch = debounce(async (query: string) => {
  if (query.length < 2) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  loading.value = true
  try {
    const results = await suppliersStore.searchSuppliers(query)
    searchResults.value = results
    showDropdown.value = true
  } catch (error) {
    // Error handling is done by ErrorHandlers
    searchResults.value = []
  } finally {
    loading.value = false
  }
}, 300)

// Methods
const selectSupplier = (supplier: PurchaseSupplier) => {
  selectedSupplier.value = supplier
  searchQuery.value = supplier.name
  showDropdown.value = false
  emit('update:modelValue', supplier.id)
  emit('change', supplier)
}

const clearSelection = () => {
  selectedSupplier.value = null
  searchQuery.value = ''
  showDropdown.value = false
  emit('update:modelValue', null)
  emit('change', null)
  searchInput.value?.focus()
}

const handleSearch = () => {
  debouncedSearch(searchQuery.value)
}

const handleFocus = () => {
  if (searchQuery.value.length >= 2 && searchResults.value.length > 0) {
    showDropdown.value = true
  }
}

const handleBlur = () => {
  // Delay hiding dropdown to allow click events
  setTimeout(() => {
    showDropdown.value = false
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value || searchResults.value.length === 0) return

  const currentIndex = searchResults.value.findIndex(
    supplier => supplier.id === selectedSupplier.value?.id
  )

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      const nextIndex = Math.min(currentIndex + 1, searchResults.value.length - 1)
      selectedSupplier.value = searchResults.value[nextIndex]
      break
    case 'ArrowUp':
      event.preventDefault()
      const prevIndex = Math.max(currentIndex - 1, 0)
      selectedSupplier.value = searchResults.value[prevIndex]
      break
    case 'Enter':
      event.preventDefault()
      if (selectedSupplier.value) {
        selectSupplier(selectedSupplier.value)
      }
      break
    case 'Escape':
      showDropdown.value = false
      break
  }
}

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedSupplier.value?.id) {
    // Find supplier by ID in current results or fetch it
    const supplier = searchResults.value.find(s => s.id === newValue)
    if (supplier) {
      selectedSupplier.value = supplier
      searchQuery.value = supplier.name
    }
  } else if (!newValue && selectedSupplier.value) {
    selectedSupplier.value = null
    searchQuery.value = ''
  }
}, { immediate: true })

// Click outside to close dropdown
const handleClickOutside = (event: MouseEvent) => {
  if (
    dropdown.value &&
    !dropdown.value.contains(event.target as Node) &&
    !inputContainer.value?.contains(event.target as Node)
  ) {
    showDropdown.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})
</script>