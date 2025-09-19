/**
 * 🎬 Composable для управления анимациями
 * Предоставляет универсальные функции для анимаций на всех страницах
 */

import { ref, computed, readonly } from 'vue'

export interface AnimationConfig {
  duration: number
  easing: string
  delay: number
}

export interface LoadingState {
  isLoading: boolean
  hasData: boolean
  showSkeleton: boolean
  showOverlay: boolean
}

export function useAnimations() {
  // Конфигурация анимаций
  const animationConfig = ref<AnimationConfig>({
    duration: 0.6,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0.05
  })

  // Состояние загрузки
  const loadingState = ref<LoadingState>({
    isLoading: false,
    hasData: false,
    showSkeleton: false,
    showOverlay: false
  })

  // Computed свойства для анимаций
  const shouldShowSkeleton = computed(() => 
    loadingState.value.isLoading && !loadingState.value.hasData
  )

  const shouldShowOverlay = computed(() => 
    loadingState.value.isLoading && loadingState.value.hasData
  )

  const shouldShowSpinner = computed(() => 
    loadingState.value.isLoading && !loadingState.value.hasData
  )

  // Функции для управления состоянием
  function setLoading(isLoading: boolean) {
    loadingState.value.isLoading = isLoading
  }

  function setHasData(hasData: boolean) {
    loadingState.value.hasData = hasData
  }

  function updateLoadingState(isLoading: boolean, hasData: boolean) {
    loadingState.value.isLoading = isLoading
    loadingState.value.hasData = hasData
  }

  // Функции для анимаций
  function getStaggerDelay(index: number): number {
    return index * animationConfig.value.delay
  }

  function getAnimationClass(index: number): string {
    return `animation-delay-${index}`
  }

  // Конфигурация для разных типов анимаций
  const animationTypes = {
    slideInUp: {
      duration: 0.6,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      keyframes: {
        from: {
          opacity: 0,
          transform: 'translateY(30px) scale(0.95)'
        },
        to: {
          opacity: 1,
          transform: 'translateY(0) scale(1)'
        }
      }
    },
    fadeIn: {
      duration: 0.3,
      easing: 'ease-out',
      keyframes: {
        from: { opacity: 0 },
        to: { opacity: 1 }
      }
    },
    slideInRight: {
      duration: 0.3,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      keyframes: {
        from: {
          opacity: 0,
          transform: 'translateX(100%)'
        },
        to: {
          opacity: 1,
          transform: 'translateX(0)'
        }
      }
    }
  }

  return {
    // Состояние
    loadingState: readonly(loadingState),
    shouldShowSkeleton,
    shouldShowOverlay,
    shouldShowSpinner,
    
    // Конфигурация
    animationConfig: readonly(animationConfig),
    animationTypes,
    
    // Функции
    setLoading,
    setHasData,
    updateLoadingState,
    getStaggerDelay,
    getAnimationClass
  }
}

// Утилиты для анимаций
export const animationUtils = {
  // Создание CSS переменных для анимаций
  createCSSVariables(config: AnimationConfig): Record<string, string> {
    return {
      '--animation-duration': `${config.duration}s`,
      '--animation-easing': config.easing,
      '--animation-delay': `${config.delay}s`
    }
  },

  // Генерация стилей для staggered анимаций
  generateStaggerStyles(count: number, baseDelay: number = 0.05): string {
    let styles = ''
    for (let i = 0; i < count; i++) {
      const delay = i * baseDelay
      styles += `.table-row:nth-child(${i + 1}) { animation-delay: ${delay}s; }\n`
    }
    return styles
  },

  // Проверка поддержки reduced motion
  prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Адаптивная конфигурация анимаций
  getAdaptiveConfig(): AnimationConfig {
    const prefersReduced = animationUtils.prefersReducedMotion()
    
    if (prefersReduced) {
      return {
        duration: 0.1,
        easing: 'ease',
        delay: 0
      }
    }

    return {
      duration: 0.6,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      delay: 0.05
    }
  }
}
