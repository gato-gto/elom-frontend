<template>
  <div class="form-control w-full" ref="inputContainer">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }}</span>
      <span v-if="required" class="label-text-alt text-error">*</span>
    </label>
    
    <div class="relative">
      <input
        ref="searchInput"
        type="text"
        :value="displayValue"
        @input="handleInput"
        @focus="handleFocus"
        @keydown="handleKeydown"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'input input-bordered w-full',
          { 'input-error': hasError },
          { 'input-success': isSuccess },
          { 'input-disabled': disabled }
        ]"
      />
      
      <!-- Dropdown with search results -->
      <div
        v-if="showDropdown && searchResults.length > 0"
        ref="dropdown"
        class="absolute z-50 w-full mt-1  border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
      >
        <div
          v-for="(item, index) in searchResults"
          :key="item.id"
          @click="selectItem(item)"
          @mouseenter="highlightedIndex = index"
          :class="[
            'px-4 py-2 cursor-pointer hover:bg-base-200',
            { 'bg-base-200': index === highlightedIndex }
          ]"
        >
          <slot name="item" :item="item">
            {{ item.name }}
          </slot>
        </div>
      </div>
      
      <!-- Custom item option -->
      <div
        v-if="showDropdown && allowCustom && searchQuery && searchResults.length === 0"
        ref="dropdown"
        class="absolute z-50 w-full mt-1  border border-base-300 rounded-lg shadow-lg"
      >
        <div
          @click="handleCustomItem"
          class="px-4 py-2 cursor-pointer hover:bg-base-200 text-primary"
        >
          <slot name="custom-item" :query="searchQuery">
            + Создать "{{ searchQuery }}"
          </slot>
        </div>
      </div>
    </div>
    
    <label v-if="hasError" class="label">
      <span class="label-text-alt text-error">{{ error }}</span>
    </label>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: number, name: string }">
/* eslint-disable no-undef */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { debounce } from '@/utils/debounce'

interface Props {
  modelValue?: number | null
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  isSuccess?: boolean
  allowCustom?: boolean
  searchFunction: (query: string) => T[]
  loadFunction?: (id: number) => Promise<T | null>
  excludeIds?: number[]
  minSearchLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск...',
  minSearchLength: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
  'item-selected': [item: T]
  'custom-item': [name: string]
  'input': [query: string]
}>()

// ========== Refs ==========

const searchInput = ref<InstanceType<typeof HTMLInputElement>>()
const dropdown = ref<InstanceType<typeof HTMLDivElement>>()
const inputContainer = ref<InstanceType<typeof HTMLDivElement>>()
const searchQuery = ref('')
const showDropdown = ref(false)
const highlightedIndex = ref(0)
const selectedItem = ref<T | null>(null)
const isUserTyping = ref(false)

// ========== Computed ==========

const hasError = computed(() => !!props.error)

const displayValue = computed(() => {
  if (isUserTyping.value) {
    return searchQuery.value
  }
  return selectedItem.value?.name || searchQuery.value
})

const searchResults = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < props.minSearchLength) {
    return []
  }
  
  const results = props.searchFunction(searchQuery.value)
  
  // Фильтруем исключенные ID
  if (props.excludeIds && props.excludeIds.length > 0) {
    return results.filter(item => !props.excludeIds!.includes(item.id))
  }
  
  return results
})

// ========== Methods ==========

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
  isUserTyping.value = true
  showDropdown.value = true
  highlightedIndex.value = 0
  
  emit('input', searchQuery.value)
  
  // Если поле очищено, сбрасываем выбор
  if (!searchQuery.value) {
    selectedItem.value = null
    emit('update:modelValue', null)
  }
}

function handleFocus() {
  if (!props.disabled) {
    showDropdown.value = true
    isUserTyping.value = true
  }
}

function selectItem(item: T) {
  selectedItem.value = item
  searchQuery.value = item.name
  isUserTyping.value = false
  showDropdown.value = false
  
  emit('update:modelValue', item.id)
  emit('item-selected', item)
}

function handleCustomItem() {
  if (props.allowCustom && searchQuery.value) {
    emit('custom-item', searchQuery.value)
    showDropdown.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!showDropdown.value) {return}
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (searchResults.value[highlightedIndex.value]) {
        selectItem(searchResults.value[highlightedIndex.value])
      } else if (props.allowCustom && searchQuery.value) {
        handleCustomItem()
      }
      break
    case 'Escape':
      showDropdown.value = false
      break
  }
}

async function loadSelectedItem() {
  if (props.modelValue && props.loadFunction) {
    try {
      const item = await props.loadFunction(props.modelValue)
      if (item) {
        selectedItem.value = item
        searchQuery.value = item.name
        isUserTyping.value = false
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading selected item:', error)
      }
    }
  }
}

// Click outside to close dropdown
function handleClickOutside(event: MouseEvent) {
  if (
    dropdown.value &&
    !dropdown.value.contains(event.target as Node) &&
    !inputContainer.value?.contains(event.target as Node)
  ) {
    showDropdown.value = false
  }
}

// ========== Lifecycle ==========

watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedItem.value?.id) {
    loadSelectedItem()
  } else if (!newValue) {
    selectedItem.value = null
    searchQuery.value = ''
  }
}, { immediate: true })

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

