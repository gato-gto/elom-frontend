import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('system')
  const isDark = ref(false)

  // Функция для определения системной темы
  function getSystemTheme(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // A-07 (F-523) + уточнение F-1007: <meta theme-color> тонирует ХРОМ Safari-браузера (адресную
  // строку/тулбары), НО НЕ статус-бар standalone-PWA — тот при black-translucent прозрачен, и его
  // читаемость в светлой теме даёт тёмная подложка-полоска body::before (components.css, F-1007).
  // Тег всё равно обновляем под текущую тему — для браузерного хрома.
  const THEME_COLOR = { light: '#F4F7F8', dark: '#16222B' } // фон приложения сверху в каждой теме
  function updateThemeColor(dark: boolean) {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) { meta.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light) }
  }

  // Функция для применения темы
  function applyTheme(newTheme: Theme) {
    const html = document.documentElement
    
    switch (newTheme) {
      case 'dark':
        html.classList.add('dark')
        html.setAttribute('data-theme', 'dark')
        isDark.value = true
        break
      case 'light':
        html.classList.remove('dark')
        html.setAttribute('data-theme', 'light')
        isDark.value = false
        break
      case 'system': {
        const systemIsDark = getSystemTheme()
        if (systemIsDark) {
          html.classList.add('dark')
          html.setAttribute('data-theme', 'dark')
        } else {
          html.classList.remove('dark')
          html.setAttribute('data-theme', 'light')
        }
        isDark.value = systemIsDark
        break
      }
    }
    updateThemeColor(isDark.value) // A-07: статус-бар iOS под текущую тему
  }

  // Функция для переключения темы
  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    applyTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // Функция для переключения между светлой и темной темой
  function toggleTheme() {
    if (theme.value === 'system') {
      setTheme(isDark.value ? 'light' : 'dark')
    } else {
      setTheme(theme.value === 'light' ? 'dark' : 'light')
    }
  }

  // Инициализация темы
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') as Theme
    const initialTheme = savedTheme || 'system'
    
    theme.value = initialTheme
    applyTheme(initialTheme)

    // Слушаем изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme('system')
      }
    })
  }

  // Реактивное обновление темы
  watch(theme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    initTheme
  }
})
