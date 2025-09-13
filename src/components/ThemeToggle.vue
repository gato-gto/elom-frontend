<!-- src/components/ThemeToggle.vue -->
<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path
            d="M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm6.36 2.64a1 1 0 0 1 1.41 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71ZM21 11a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM5.64 5.64a1 1 0 0 1 1.41 0l.71.71A1 1 0 0 1 6.35 7.76l-.71-.71a1 1 0 0 1 0-1.41ZM12 18a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1Zm7.07-3.07a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0ZM4 11a1 1 0 0 1 0 2H3a1 1 0 1 1 0-2h1Zm3.05 5.66a1 1 0 1 1 1.41 1.41l-.71.71a1 1 0 1 1-1.41-1.41l.71-.71Z"/>
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
import {onMounted, ref, computed} from 'vue'

type Theme = { value: string; label: string }
const themes: Theme[] = [
  {value: 'light', label: 'Light'},
  {value: 'dark', label: 'Dark'},
  // {value: 'corporate', label: 'Corporate'},
  // {value: 'winter', label: 'Winter'},
]

const STORAGE_KEY = 'elom_theme'
const theme = ref<string>('light')

const activeLabel = computed(() => themes.find(t => t.value === theme.value)?.label ?? theme.value)

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
  if (saved && themes.some(t => t.value === saved)) theme.value = saved
  applyTheme(theme.value)
})
</script>
