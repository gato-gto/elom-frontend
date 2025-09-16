<!-- src/components/Pagination.vue -->
<template>
  <div class="flex items-center gap-2 justify-between">
    <div class="text-sm opacity-70">
      {{ startItem }}–{{ endItem }} из {{ total }}
    </div>
    <div class="join">
      <button class="join-item btn btn-sm" :disabled="page<=1" @click="go(1)">«</button>
      <button class="join-item btn btn-sm" :disabled="page<=1" @click="go(page-1)">‹</button>
      <button
          v-for="p in visiblePages"
          :key="p"
          class="join-item btn btn-sm"
          :class="p===page ? 'btn-active' : ''"
          @click="go(p)"
      >{{ p }}</button>
      <button class="join-item btn btn-sm" :disabled="page>=pages" @click="go(page+1)">›</button>
      <button class="join-item btn btn-sm" :disabled="page>=pages" @click="go(pages)">»</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
  maxButtons?: number
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
  (e: 'change', page: number): void
}>()

const pages = computed(() => Math.max(1, Math.ceil((props.total || 0) / (props.pageSize || 1))))
const page = computed(() => Math.min(Math.max(1, props.page || 1), pages.value))
const startItem = computed(() => (page.value - 1) * props.pageSize + 1)
const endItem = computed(() => Math.min(props.total, page.value * props.pageSize))
const visiblePages = computed(() => {
  const max = props.maxButtons ?? 5
  const half = Math.floor(max / 2)
  const start = Math.max(1, Math.min(page.value - half, pages.value - max + 1))
  const end = Math.min(pages.value, start + max - 1)
  const arr: number[] = []
  for (let i = start; i <= end; i++) arr.push(i)
  return arr
})

function go(p: number) {
  const np = Math.min(Math.max(1, p), pages.value)
  emit('update:page', np)
  emit('change', np)
}
</script>
