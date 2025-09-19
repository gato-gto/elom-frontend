// src/main.ts
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import App from './App.vue'
import router from './router'

import '@/assets/tailwind.css'
import '@/assets/daisyui-reference.css'
import '@/assets/login-animations.css'
import '@/assets/navigation-styles.css'
import '@/styles/animations.css' 

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Инициализируем тему
import { useThemeStore } from '@/stores/theme'
const themeStore = useThemeStore()
themeStore.initTheme()

// Важно: инициализируем auth до старта роутера
import {useAuthStore} from '@/stores/auth'

const auth = useAuthStore()
auth.tryHydrate?.()

app.use(router)
app.mount('#app')
