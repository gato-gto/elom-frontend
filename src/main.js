// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import '@/assets/tailwind.css';
const root = document.documentElement;
const saved = localStorage.getItem('theme');
if (saved === 'dark')
    root.classList.add('dark');
else
    root.classList.remove('dark');
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
// Важно: инициализируем auth до старта роутера
import { useAuthStore } from '@/stores/auth';
const auth = useAuthStore();
auth.tryHydrate?.();
app.use(router);
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
app.mount('#app');
