<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path
            d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm5.66 2.34a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41ZM21 11h-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2ZM6.34 5.34a1 1 0 0 0 0 1.41l-.71.71A1 1 0 1 0 7.05 8.9l.71-.71a1 1 0 1 0-1.41-1.41ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM4 13H3a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2Zm1.05 4.95a1 1 0 0 0 0 1.41l-.71.71a1 1 0 0 0 1.41 0l.71-.71a1 1 0 0 0 0-1.41ZM21 18.78a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71Z"/>
      </svg>
      <span class="ml-2 hidden sm:inline text-xs">{{ activeLabel }}</span>
    </div>
    <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44 z-50">
      <li v-for="t in themes" :key="t.value">
        <a @click="setTheme(t.value)" :class="{ active: theme === t.value }">{{ t.label }}</a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'

const STORAGE_KEY = 'theme'
const themes = [
  {value: 'light', label: 'Светлая'},
  {value: 'dark', label: 'Тёмная'},
] as const

const theme = ref<string>('light')
const activeLabel = computed(() => themes.find(t => t.value === theme.value)?.label ?? '')

function applyTheme(v: string) {
  document.documentElement.setAttribute('data-theme', v)
}

function setTheme(v: string) {
  theme.value = v
  localStorage.setItem(STORAGE_KEY, v)
  applyTheme(v)
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && themes.some(t => t.value === saved)) theme.value = saved as any
  applyTheme(theme.value)
})
</script>
