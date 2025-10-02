<!-- src/components/GeolocationPicker.vue -->
<template>
  <div class="space-y-4">
    <!-- Заголовок секции -->
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-sm btn-outline btn-primary"
          @click="getCurrentLocation"
          :disabled="gettingLocation"
        >
          <svg v-if="gettingLocation" class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          {{ gettingLocation ? 'Получение...' : 'Текущее' }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="toggleMapView"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          {{ showMap ? 'Скрыть карту' : 'Выбрать на карте' }}
        </button>
      </div>
    </div>

    <!-- Карта Яндекс -->
    <div v-if="showMap" class="border rounded-lg overflow-hidden">
      <div 
        ref="mapContainer" 
        class="w-full h-80 bg-base-200 flex items-center justify-center"
      >
        <div v-if="mapLoading" class="text-center">
          <svg class="w-8 h-8 mx-auto mb-2 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <p class="text-sm text-base-content/70">Загрузка карты...</p>
        </div>
        <div v-else-if="mapError" class="text-center p-4">
          <svg class="w-8 h-8 mx-auto mb-2 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <p class="text-sm text-error">{{ mapError }}</p>
          <button 
            type="button" 
            class="btn btn-sm btn-outline mt-2"
            @click="initMap"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    </div>


   
    <!-- Предварительный просмотр -->
    <div v-if="lat && lng" class="p-3 bg-base-200 rounded-lg">
      <div class="flex items-center gap-2 text-sm">
        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
        <span class="text-base-content/70">Координаты:</span>
        <span class="font-mono text-sm">{{ lat }}, {{ lng }}</span>
      </div>
      
      <!-- Ссылки на карты -->
      <div class="flex gap-2 mt-2">
        <a
          :href="`https://www.google.com/maps?q=${lat},${lng}`"
          target="_blank"
          class="btn btn-xs btn-outline btn-primary"
        >
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Google Maps
        </a>
        <a
          :href="`https://yandex.ru/maps/?ll=${lng}%2C${lat}&z=15&l=map`"
          target="_blank"
          class="btn btn-xs btn-outline"
        >
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Яндекс.Карты
        </a>
      </div>
    </div>

    <!-- Сообщение об ошибке геолокации -->
    <div v-if="locationError" class="alert alert-warning">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>
      <span>{{ locationError }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Типы для Яндекс.Карт
declare global {
  interface Window {
    ymaps: any
  }
}

const props = defineProps<{
  modelValue: {
    lat?: string
    lng?: string
  }
  errors?: Record<string, string>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { lat?: string; lng?: string }]
}>()

const gettingLocation = ref(false)
const locationError = ref('')
const showMap = ref(false)
const mapLoading = ref(false)
const mapError = ref('')
const mapContainer = ref<HTMLElement>()
const yandexMap = ref<any>(null)
const placemark = ref<any>(null)

const lat = computed({
  get: () => props.modelValue.lat || '',
  set: (value: string) => {
    emit('update:modelValue', {
      ...props.modelValue,
      lat: value || undefined
    })
  }
})

const lng = computed({
  get: () => props.modelValue.lng || '',
  set: (value: string) => {
    emit('update:modelValue', {
      ...props.modelValue,
      lng: value || undefined
    })
  }
})


function setCoordinates(latitude: number, longitude: number) {
  lat.value = latitude.toString()
  lng.value = longitude.toString()
  locationError.value = ''
  
  // Обновляем карту если она активна
  if (yandexMap.value) {
    const coords = [latitude, longitude]
    yandexMap.value.setCenter(coords, 15)
    addPlacemark(coords)
  }
}

function clearCoordinates() {
  lat.value = ''
  lng.value = ''
  locationError.value = ''
  if (placemark.value && yandexMap.value) {
    yandexMap.value.geoObjects.remove(placemark.value)
    placemark.value = null
  }
}

function toggleMapView() {
  showMap.value = !showMap.value
  if (showMap.value) {
    nextTick(() => {
      initMap()
    })
  }
}

async function initMap() {
  if (!mapContainer.value) return

  mapLoading.value = true
  mapError.value = ''

  try {
    // Проверяем, загружен ли API Яндекс.Карт
    if (!window.ymaps) {
      await loadYandexMapsAPI()
    }

    // Инициализируем карту
    const center = lat.value && lng.value 
      ? [parseFloat(lat.value), parseFloat(lng.value)]
      : [41.3111, 69.2797] // Ташкент по умолчанию

    yandexMap.value = new window.ymaps.Map(mapContainer.value, {
      center: center,
      zoom: 12,
      controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
    })

    // Добавляем обработчик кликов
    yandexMap.value.events.add('click', (e: any) => {
      const coords = e.get('coords')
      updateCoordinatesFromMap(coords)
    })

    // Если есть координаты, добавляем метку
    if (lat.value && lng.value) {
      addPlacemark([parseFloat(lat.value), parseFloat(lng.value)])
    }

  } catch (error: any) {
    mapError.value = 'Ошибка загрузки карты: ' + error.message
    console.error('Map initialization error:', error)
  } finally {
    mapLoading.value = false
  }
}

function loadYandexMapsAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=&lang=ru_RU'
    script.onload = () => {
      window.ymaps.ready(() => {
        resolve()
      })
    }
    script.onerror = () => {
      reject(new Error('Failed to load Yandex Maps API'))
    }
    document.head.appendChild(script)
  })
}

function addPlacemark(coords: number[]) {
  if (!yandexMap.value) return

  // Удаляем существующую метку
  if (placemark.value) {
    yandexMap.value.geoObjects.remove(placemark.value)
  }

  // Создаем новую метку
  placemark.value = new window.ymaps.Placemark(coords, {
    balloonContent: 'Выбранное местоположение'
  }, {
    draggable: true,
    preset: 'islands#redDotIcon'
  })

  // Добавляем метку на карту
  yandexMap.value.geoObjects.add(placemark.value)

  // Обработчик перетаскивания метки
  placemark.value.events.add('dragend', () => {
    const newCoords = placemark.value.geometry.getCoordinates()
    updateCoordinatesFromMap(newCoords)
  })
}

function updateCoordinatesFromMap(coords: number[]) {
  lat.value = coords[0].toFixed(6)
  lng.value = coords[1].toFixed(6)
  addPlacemark(coords)
}


async function getCurrentLocation() {
  if (!navigator.geolocation) {
    locationError.value = 'Геолокация не поддерживается вашим браузером'
    return
  }

  gettingLocation.value = true
  locationError.value = ''

  try {
    const position = await new Promise<any>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      })
    })

    const { latitude, longitude } = position.coords
    setCoordinates(latitude, longitude)
  } catch (error: any) {
    let errorMessage = 'Не удалось получить местоположение'
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.'
        break
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Информация о местоположении недоступна'
        break
      case error.TIMEOUT:
        errorMessage = 'Время ожидания получения местоположения истекло'
        break
    }
    
    locationError.value = errorMessage
  } finally {
    gettingLocation.value = false
  }
}

// Очистка при размонтировании
onUnmounted(() => {
  if (yandexMap.value) {
    yandexMap.value.destroy()
  }
})
</script>
