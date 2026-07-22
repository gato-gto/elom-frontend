// src/main.ts
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import router from './router'

// Импортируем полифиллы для совместимости со старыми браузерами
import '@/utils/polyfills'

// Проверяем поддержку браузера
import '@/utils/browserSupport'

// Design language (D-020): self-hosted IBM Plex Sans (UI) + IBM Plex Mono (данные), офлайн/PWA-ready
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import '@/assets/tailwind.css'
import '@/assets/navigation-styles.css'
import '@/styles/animations.css'
import '@/styles/components.css' 

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Инициализируем тему
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
themeStore.initTheme()

// Важно: инициализируем stores до старта роутера
import {useAuthStore} from '@/stores/auth'
import {useUiStore} from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()

// Регистрируем stores для доступа из API клиента
if (!window.__piniaStores) {window.__piniaStores = {}}
window.__piniaStores.auth = { useAuthStore }
window.__piniaStores.ui = { useUiStore }

app.use(router)
app.mount('#app')
