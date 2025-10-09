<template>
  <div class="theme-toggle">
    <button 
      class="theme-btn"
      @click="toggleTheme"
      :title="themeTitle"
      :class="{ 'theme-btn-dark': isDark }"
    >
      <transition name="theme-icon" mode="out-in">
        <svg 
          v-if="isDark" 
          key="moon"
          class="theme-icon"
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.1 8.59 8.59 0 01.25-2A1 1 0 008 2.36a10.14 10.14 0 1014 11.69 1 1 0 00-.36-1.05zM12 19a7 7 0 01-6.92-6 9.77 9.77 0 001.92.2 10.15 10.15 0 0010.14-10.14 9.79 9.79 0 00-.2-1.92A8 8 0 0112 19z"/>
        </svg>
        <svg 
          v-else 
          key="sun"
          class="theme-icon"
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 2a1 1 0 001 1v2a1 1 0 00-2 0V3a1 1 0 001-1zM21 12a1 1 0 01-1 1h-2a1 1 0 010-2h2a1 1 0 011 1zM6 12a1 1 0 01-1 1H3a1 1 0 010-2h2a1 1 0 011 1zM12 22a1 1 0 01-1-1v-2a1 1 0 012 0v2a1 1 0 01-1 1zM18.36 17.64a1 1 0 01-1.41 0l-1.42-1.41a1 1 0 011.42-1.42l1.41 1.42a1 1 0 010 1.41zM7.05 6.34a1 1 0 00-1.41 0L4.22 7.76a1 1 0 001.41 1.41L7.05 7.76a1 1 0 000-1.42zM17.66 7.76l1.42-1.42a1 1 0 00-1.42-1.41L16.24 6.34a1 1 0 001.42 1.42zM6.34 16.24L4.93 17.66a1 1 0 001.41 1.41l1.42-1.42a1 1 0 00-1.42-1.41zM12 6.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11z"/>
        </svg>
      </transition>
    </button>
    
    <div v-if="showDropdown" class="theme-dropdown">
      <button 
        v-for="option in themeOptions" 
        :key="option.value"
        class="theme-option"
        :class="{ 'theme-option-active': theme === option.value }"
        @click="setTheme(option.value)"
      >
        <component :is="option.icon" class="theme-option-icon" />
        <span>{{ option.label }}</span>
        <svg 
          v-if="theme === option.value"
          class="theme-check"
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { Theme } from '@/stores/theme'

const themeStore = useThemeStore()
const showDropdown = ref(false)

const { theme, isDark, setTheme, toggleTheme } = themeStore

const themeTitle = computed(() => {
  return isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'
})

const themeOptions = [
  {
    value: 'light' as Theme,
    label: 'Светлая',
    icon: 'SunIcon'
  },
  {
    value: 'dark' as Theme,
    label: 'Темная',
    icon: 'MoonIcon'
  },
  {
    value: 'system' as Theme,
    label: 'Системная',
    icon: 'ComputerIcon'
  }
]
</script>

<style scoped>
.theme-toggle {
  position: relative;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.2);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
  color: #64748b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.theme-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.theme-btn-dark {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.2);
}

.theme-btn-dark:hover {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-color: #8b5cf6;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

.theme-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: all 0.3s ease;
}

.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.3s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.8);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.8);
}

.theme-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 50;
  min-width: 8rem;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  text-align: left;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #3b82f6;
}

.theme-option-active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.theme-option-active:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
}

.theme-option-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.theme-check {
  width: 1rem;
  height: 1rem;
  margin-left: auto;
  flex-shrink: 0;
}

/* Dark theme styles */
@media (prefers-color-scheme: dark) {
  .theme-dropdown {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(148, 163, 184, 0.2);
  }
  
  .theme-option {
    color: #e2e8f0;
  }
  
  .theme-option:hover {
    background: linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(71, 85, 105, 0.8) 100%);
    color: #8b5cf6;
  }
}

:root.dark .theme-dropdown {
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(148, 163, 184, 0.2);
}

:root.dark .theme-option {
  color: #e2e8f0;
}

:root.dark .theme-option:hover {
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.8) 0%, rgba(71, 85, 105, 0.8) 100%);
  color: #8b5cf6;
}
</style>