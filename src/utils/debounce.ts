// Утилиты для debounce и throttle
import { getCurrentScope, onScopeDispose, ref, watch } from 'vue'

// F-1129: отложенный вызов не переживает своего владельца. Создан в области эффектов (setup компонента, composable,
// setup-стор) — таймер снимается при её уничтожении: уход со страницы в течение задержки больше не шлёт запрос
// «ничьего» списка/отчёта (и таймер прежнего экземпляра не стреляет в следующем тесте). Вне области — как раньше.
function cancelOnScopeDispose(cancel: () => void) {
  if (getCurrentScope()) { onScopeDispose(cancel) }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  cancelOnScopeDispose(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  })

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      timeoutId = null
      func(...args)
    }, delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// Debounce с возможностью отмены
export function cancellableDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
) {
  let timeoutId: NodeJS.Timeout | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
  cancelOnScopeDispose(cancel)

  return { debounced, cancel }
}

// Debounce для Vue ref
export function useDebouncedRef<T>(initialValue: T, delay: number) {
  const value = ref(initialValue)
  const debouncedValue = ref(initialValue)

  const debouncedUpdate = debounce((newValue: T) => {
    debouncedValue.value = newValue
  }, delay)

  watch(value, (newValue) => {
    debouncedUpdate(newValue)
  })

  return { value, debouncedValue }
}