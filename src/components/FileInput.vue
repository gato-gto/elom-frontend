<!-- src/components/FileInput.vue -->
<template>
  <div class="grid gap-2">
    <input
        ref="fileEl"
        type="file"
        :accept="accept || 'image/*'"
        class="file-input file-input-bordered file-input-sm w-full max-w-xs"
        @change="onChange"
    />

    <div v-if="previewUrl" class="rounded-xl border bg-white p-2 w-full max-w-xs">
      <img :src="previewUrl" alt="preview" class="w-full h-40 object-contain bg-gray-50 rounded-lg"/>
    </div>

    <div class="flex items-center gap-2">
      <button v-if="hasFile" type="button" class="btn btn-ghost btn-sm" @click="clear">Очистить</button>
      <span v-if="fileName" class="text-xs opacity-70 truncate max-w-[16rem]">{{ fileName }}</span>
    </div>

    <p v-if="error" class="text-xs text-error">{{ error }}</p>
    <p class="text-xs opacity-60">Допустимые типы: {{ accept || 'image/*' }}, макс. {{ maxSizeMb }} MB</p>
  </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'

const props = defineProps<{
  modelValue: File | null
  existingUrl?: string | null
  accept?: string
  maxSizeMb?: number
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: File | null): void }>()

const fileEl = ref<HTMLInputElement | null>(null)
const error = ref<string | null>(null)
const fileName = computed(() => props.modelValue?.name || null)
const hasFile = computed(() => !!props.modelValue)

const previewUrl = computed(() => {
  if (props.modelValue) return URL.createObjectURL(props.modelValue)
  return props.existingUrl || null
})

watch(() => props.modelValue, (f) => {
  if (!f) error.value = null
})

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] || null
  if (!file) {
    emit('update:modelValue', null);
    return
  }
  const max = (props.maxSizeMb ?? 8) * 1024 * 1024
  if (file.size > max) {
    error.value = `Размер файла превышает ${(props.maxSizeMb ?? 8)} MB`
    input.value = ''
    return
  }
  const accept = props.accept || 'image/*'
  if (accept.includes('image') && !file.type.startsWith('image/')) {
    error.value = 'Неверный тип файла'
    input.value = ''
    return
  }
  error.value = null
  emit('update:modelValue', file)
}

function clear() {
  emit('update:modelValue', null)
  if (fileEl.value) fileEl.value.value = ''
}
</script>

