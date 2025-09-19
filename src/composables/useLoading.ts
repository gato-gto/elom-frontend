import { ref, computed } from 'vue'

export interface LoadingState {
  isLoading: boolean
  loadingText?: string
  loadingVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

export function useLoading(initialState: LoadingState = { isLoading: false }) {
  const loadingState = ref<LoadingState>(initialState)

  const isLoading = computed(() => loadingState.value.isLoading)
  const loadingText = computed(() => loadingState.value.loadingText)
  const loadingVariant = computed(() => loadingState.value.loadingVariant)

  const startLoading = (text?: string, variant: LoadingState['loadingVariant'] = 'primary') => {
    loadingState.value = {
      isLoading: true,
      loadingText: text,
      loadingVariant: variant
    }
  }

  const stopLoading = () => {
    loadingState.value = {
      isLoading: false
    }
  }

  const setLoadingText = (text: string) => {
    if (loadingState.value.isLoading) {
      loadingState.value.loadingText = text
    }
  }

  const setLoadingVariant = (variant: LoadingState['loadingVariant']) => {
    if (loadingState.value.isLoading) {
      loadingState.value.loadingVariant = variant
    }
  }

  // Утилиты для разных типов загрузки
  const withLoading = async <T>(
    asyncFn: () => Promise<T>,
    loadingText?: string,
    variant: LoadingState['loadingVariant'] = 'primary'
  ): Promise<T> => {
    try {
      startLoading(loadingText, variant)
      const result = await asyncFn()
      return result
    } finally {
      stopLoading()
    }
  }

  const withLoadingState = <T>(
    asyncFn: () => Promise<T>,
    loadingText?: string,
    variant: LoadingState['loadingVariant'] = 'primary'
  ) => {
    return withLoading(asyncFn, loadingText, variant)
  }

  return {
    // State
    loadingState,
    isLoading,
    loadingText,
    loadingVariant,

    // Methods
    startLoading,
    stopLoading,
    setLoadingText,
    setLoadingVariant,
    withLoading,
    withLoadingState
  }
}

// Хук для работы с загрузкой в компонентах
export function useLoadingComponent() {
  const { 
    isLoading, 
    loadingText, 
    loadingVariant,
    startLoading, 
    stopLoading,
    withLoading 
  } = useLoading()

  // Предустановленные варианты загрузки
  const loadingPresets = {
    fetching: (text = 'Загрузка данных...') => startLoading(text, 'primary'),
    saving: (text = 'Сохранение...') => startLoading(text, 'success'),
    deleting: (text = 'Удаление...') => startLoading(text, 'error'),
    uploading: (text = 'Загрузка файла...') => startLoading(text, 'warning'),
    processing: (text = 'Обработка...') => startLoading(text, 'secondary')
  }

  return {
    isLoading,
    loadingText,
    loadingVariant,
    startLoading,
    stopLoading,
    withLoading,
    loadingPresets
  }
}
