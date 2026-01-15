/**
 * Composable для ленивой загрузки элементов с использованием Intersection Observer
 * Оптимизирует производительность на мобильных устройствах
 */

import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'

export interface UseLazyLoadOptions {
  /**
   * Root margin для Intersection Observer (например, '50px' для предзагрузки)
   * По умолчанию '100px' для предзагрузки элементов перед появлением
   */
  rootMargin?: string
  
  /**
   * Порог видимости (0-1)
   * По умолчанию 0.1 (элемент считается видимым при 10% видимости)
   */
  threshold?: number
  
  /**
   * Отключить на десктопе (для экономии ресурсов)
   * По умолчанию false
   */
  disableOnDesktop?: boolean
}

/**
 * Composable для ленивой загрузки одного элемента
 */
export function useLazyLoad(
  elementRef: Ref<HTMLElement | null>,
  options: UseLazyLoadOptions = {}
) {
  const isVisible = ref(false)
  const hasBeenVisible = ref(false)
  let observer: IntersectionObserver | null = null

  const {
    rootMargin = '100px',
    threshold = 0.1,
    disableOnDesktop = false
  } = options

  const setupObserver = () => {
    // Отключаем на десктопе, если указано
    if (disableOnDesktop && window.innerWidth >= 1024) {
      isVisible.value = true
      hasBeenVisible.value = true
      return
    }

    // Если элемент уже был виден, не создаем observer
    if (hasBeenVisible.value) {return}

    if (!elementRef.value) {return}

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            hasBeenVisible.value = true
            // Отключаем observer после первого появления
            if (observer && elementRef.value) {
              observer.unobserve(elementRef.value)
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(elementRef.value)
  }

  onMounted(() => {
    // Небольшая задержка для обеспечения готовности DOM
    setTimeout(setupObserver, 0)
  })

  onUnmounted(() => {
    if (observer && elementRef.value) {
      observer.unobserve(elementRef.value)
    }
    observer = null
  })

  return {
    isVisible,
    hasBeenVisible
  }
}

/**
 * Composable для ленивой загрузки списка элементов
 * Возвращает массив ref'ов для каждого элемента
 */
export function useLazyLoadList<T>(
  items: Ref<T[]>,
  options: UseLazyLoadOptions = {}
) {
  const visibleItems = ref<Set<number>>(new Set())
  const elementRefs = ref<Map<number, HTMLElement>>(new Map())
  let observer: IntersectionObserver | null = null

  const {
    rootMargin = '100px',
    threshold = 0.1,
    disableOnDesktop = false
  } = options

  const setupObserver = () => {
    // Отключаем на десктопе, если указано
    if (disableOnDesktop && window.innerWidth >= 1024) {
      // Помечаем все элементы как видимые
      items.value.forEach((_, index) => {
        visibleItems.value.add(index)
      })
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-lazy-index') || '-1', 10)
          if (index >= 0 && entry.isIntersecting) {
            visibleItems.value.add(index)
            // Отключаем observer для этого элемента
            if (observer) {
              observer.unobserve(entry.target)
            }
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    // Наблюдаем за всеми элементами
    elementRefs.value.forEach((element, index) => {
      element.setAttribute('data-lazy-index', index.toString())
      observer?.observe(element)
    })
  }

  const setElementRef = (index: number, element: HTMLElement | null) => {
    if (element) {
      elementRefs.value.set(index, element)
    } else {
      elementRefs.value.delete(index)
    }
  }

  const isItemVisible = (index: number): boolean => {
    return visibleItems.value.has(index)
  }

  onMounted(() => {
    // Небольшая задержка для обеспечения готовности DOM
    setTimeout(setupObserver, 0)
  })

  onUnmounted(() => {
    if (observer) {
      elementRefs.value.forEach((element) => {
        observer?.unobserve(element)
      })
    }
    observer = null
  })

  // Обновляем observer при изменении списка
  watch(items, () => {
    if (observer) {
      // Пересоздаем observer для новых элементов
      elementRefs.value.forEach((element) => {
        observer?.unobserve(element)
      })
      setTimeout(setupObserver, 0)
    }
  }, { deep: true })

  return {
    visibleItems,
    setElementRef,
    isItemVisible
  }
}
