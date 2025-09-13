// src/api/client.ts
import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios'
import {endpoints, API_PREFIX} from './endpoints'

/**
 * Единый axios-клиент с очередью refresh и защитой от "петли" 401.
 * Без импортов router во избежание цикличности — редирект из authStore.
 */
const api = axios.create({
    baseURL: API_PREFIX,
    withCredentials: false,
    headers: {'X-Requested-With': 'XMLHttpRequest'},
})

// токен в рантайме — из authStore
function getAccessToken(): string | null {
    try {
        // динамический импорт, чтобы избежать циклов
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const {useAuthStore} = window.__piniaStores?.auth || {}
        if (!useAuthStore) return null
        const store = useAuthStore()
        return store.accessToken
    } catch {
        return null
    }
}

let isRefreshing = false
let subscribers: Array<(token: string | null) => void> = []

function subscribe(cb: (token: string | null) => void) {
    subscribers.push(cb)
}

function notifyAll(token: string | null) {
    subscribers.forEach((cb) => cb(token))
    subscribers = []
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const {response, config} = error
        const original = config as any
        const status = response?.status

        // если не 401 — просто наверх
        if (status !== 401) {
            return Promise.reject(error)
        }

        // не пытаемся рефрешить для самих auth эндпоинтов
        const url = (config?.url || '').toString()
        const isAuthUrl =
            url.includes('/auth/token/') ||
            url.includes('/auth/token/refresh/') ||
            url.includes('/auth/token/verify/')

        if (isAuthUrl) {
            return Promise.reject(error)
        }

        if (original._retry) {
            // уже пытались — выходим
            return Promise.reject(error)
        }
        original._retry = true

        // запуск единого refresh
        if (!isRefreshing) {
            isRefreshing = true
            try {
                const token = await doRefresh()
                isRefreshing = false
                notifyAll(token)
                if (!token) throw new Error('refresh_failed')
            } catch {
                isRefreshing = false
                notifyAll(null)
            }
        }

        // ждём результата refresh и ретраим
        return new Promise((resolve, reject) => {
            subscribe((newToken) => {
                if (!newToken) {
                    // разлогиниваем с редиректом
                    safeLogoutWithRedirect()
                    reject(error)
                    return
                }
                original.headers = original.headers || {}
                original.headers.Authorization = `Bearer ${newToken}`
                resolve(api(original))
            })
        })
    }
)

// ——— helpers ———

async function doRefresh(): Promise<string | null> {
    try {
        const {useAuthStore} = await import('@/stores/auth')
        const store = useAuthStore()
        const newAccess = await store.refreshTokens()
        return newAccess
    } catch {
        return null
    }
}

function safeLogoutWithRedirect() {
    import('@/stores/auth').then(({useAuthStore}) => {
        const s = useAuthStore()
        s.logout(true)
    })
}

// "хук" для ui.start/done — опционально: используйте перехватчики ниже
// Если нужны визуальные индикаторы запроса — активируем:
import {useUiStore} from '@/stores/ui'

api.interceptors.request.use((cfg) => {
    try {
        useUiStore().start()
    } catch {
    }
    return cfg
})
api.interceptors.response.use(
    (r) => {
        try {
            useUiStore().done()
        } catch {
        }
        return r
    },
    (e) => {
        try {
            useUiStore().done()
        } catch {
        }
        return Promise.reject(e)
    }
)

export default api
