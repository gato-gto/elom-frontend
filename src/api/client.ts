// src/api/client.ts
import axios, {AxiosError, InternalAxiosRequestConfig, AxiosInstance} from 'axios'
import {endpoints, API_PREFIX} from './endpoints'

// Глобальные ключи (совпадают со стором)
const ACCESS_KEY = 'elom_access'
const REFRESH_KEY = 'elom_refresh'

// Доступ к сторам без циклических импортов
declare global {
    interface Window {
        __piniaStores?: {
            auth?: { useAuthStore?: () => any }
            ui?: { useUiStore?: () => any }
        }
    }
}

function authStoreSafe() {
    try {
        return window.__piniaStores?.auth?.useAuthStore?.()
    } catch {
        return null
    }
}

function uiStoreSafe() {
    try {
        return window.__piniaStores?.ui?.useUiStore?.()
    } catch {
        return null
    }
}

// Работа с токенами через localStorage (и стор, если есть)
function getAccessToken(): string | null {
    const s = authStoreSafe()
    if (s?.accessToken) { return s.accessToken as string }
    return localStorage.getItem(ACCESS_KEY)
}

function getRefreshToken(): string | null {
    const s = authStoreSafe()
    if (s?.refreshToken) { return s.refreshToken as string }
    return localStorage.getItem(REFRESH_KEY)
}

function setTokens(access?: string | null, refresh?: string | null) {
    const s = authStoreSafe()
    if (s?.saveTokens && access && refresh) {
        s.saveTokens({access, refresh})
        return
    }
    if (access) { localStorage.setItem(ACCESS_KEY, access) }
    if (refresh) { localStorage.setItem(REFRESH_KEY, refresh) }
}

function clearTokensAndLogout() {
    const s = authStoreSafe()
    if (s?.logout) {
        // F-905: logout(true) — С РЕДИРЕКТОМ на /login?session=expired. Раньше звали logout() без
        // аргумента (withRedirect=false) → при протухшей сессии (рефреш не удался) токены чистились,
        // но пользователь оставался на мёртвой странице с потоком 401/тостов. Редирект уводит на логин.
        s.logout(true)
    } else {
        localStorage.removeItem(ACCESS_KEY)
        localStorage.removeItem(REFRESH_KEY)
        location.replace('/login?session=expired')
    }
}

// Единый axios-клиент
const api: AxiosInstance = axios.create({
    baseURL: API_PREFIX,
    withCredentials: false,
    headers: {'X-Requested-With': 'XMLHttpRequest'},
})

// ---- Единая точка refresh (общий лок для ВСЕХ вызывающих) -------------------
// FE-1: refresh реализован только здесь. auth.refreshTokens() делегирует сюда, чтобы не было
// второго независимого потока без общего лока — иначе при ротации refresh-токена в SimpleJWT
// один поток инвалидировал бы токен другого и пользователя выкидывало бы на пустом месте.
// FE-7: удалена мёртвая очередь subscribers/onRefreshed — синхронизация идёт через refreshPromise.
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

/**
 * Обновление access-токена. Возвращает строго string | null.
 * Единственная точка refresh в приложении (общий лок isRefreshing/refreshPromise).
 */
export async function refreshAccessToken(): Promise<string | null> {
    const refresh = getRefreshToken()
    if (!refresh) { return null }

    if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = (async () => {
            try {
                const {data} = await axios.post<{ access: string; refresh?: string }>(
                    endpoints.auth.refresh,
                    {refresh}
                )
                const nextAccess = data.access
                const nextRefresh = data.refresh ?? refresh
                setTokens(nextAccess, nextRefresh)
                return nextAccess
            } catch {
                clearTokensAndLogout()
                return null
            } finally {
                isRefreshing = false
            }
        })()
    }

    const newAccess = await refreshPromise!
    // важно: вернуть значение, а не "void"
    return newAccess
}

// ---- Interceptors -----------------------------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // R7/PWA: в офлайне блокируем мутации (POST/PUT/PATCH/DELETE) с понятным
    // сообщением — бизнес-данные пишутся ТОЛЬКО онлайн (никаких «отложенных»
    // изменений, которые тихо разойдутся с сервером). GET-запросы просто упадут
    // и приложение покажет офлайн-баннер.
    const method = (config.method || 'get').toLowerCase()
    const isMutation = method === 'post' || method === 'put' || method === 'patch' || method === 'delete'
    if (isMutation && typeof navigator !== 'undefined' && navigator.onLine === false) {
        try {
            const ui = uiStoreSafe()
            ui?.toast?.({ type: 'error', text: 'Нет соединения — изменения недоступны в офлайн-режиме.' })
        } catch {
            // no-op
        }
        const err: any = new Error('Нет соединения — изменения недоступны в офлайн-режиме.')
        err.isOfflineBlock = true
        err.config = config
        return Promise.reject(err)
    }
    try {
        const ui = uiStoreSafe()
        if (ui && typeof ui.start === 'function') {
            ui.start()
        }
    } catch {
        // no-op
    }
    const access = getAccessToken()
    if (access) {
        config.headers = config.headers ?? {}
        ;(config.headers as any).Authorization = `Bearer ${access}`
    }
    return config
})

api.interceptors.response.use(
    (r) => {
        try {
            const ui = uiStoreSafe()
            if (ui && typeof ui.done === 'function') {
                ui.done()
            }
        } catch {
            // no-op
        }
        return r
    },
    async (error: AxiosError) => {
        const {response, config} = error
        try {
            // завершить прогресс и при ошибке
            const ui = uiStoreSafe()
            if (ui && typeof ui.done === 'function') {
                ui.done()
            }
        } catch {
            // no-op
        }

        // Попытка рефреша при 401
        if (response?.status === 401 && config && !(config as any)._retry) {
            (config as any)._retry = true
            
            // FE-2: на auth-эндпоинтах (логин /auth/token/, refresh, verify) 401 означает
            // неверные креды или мёртвый refresh, а НЕ «истёкшую сессию рабочего запроса».
            // Не рефрешим и НЕ показываем «Сессия истекла» — ошибку логина покажет auth.login.
            if (config.url?.includes('/auth/token')) {
                return Promise.reject(error)
            }
            
            const newToken = await refreshAccessToken()
            if (!newToken) {
                // Если не удалось обновить токен, показываем сообщение пользователю
                try {
                    const ui = uiStoreSafe()
                    if (ui?.toast) {
                        ui.toast({ type: 'error', text: 'Сессия истекла. Пожалуйста, войдите снова.' })
                    }
                } catch {
                    // Игнорируем ошибки UI
                }
                return Promise.reject(error)
            }
            
            // Обновляем заголовок авторизации и повторяем запрос
            config.headers = config.headers ?? {}
            ;(config.headers as any).Authorization = `Bearer ${newToken}`
            return api(config)
        }

        // FE-3: интерцептор БОЛЬШЕ НЕ показывает тосты для 403/404/500 — иначе на каждую такую
        // ошибку было ДВА тоста (здесь + handleApiErrorAsync в catch стора, часто с разным текстом).
        // Единый слой тостов — handleApiErrorAsync (там конкретный detail от бэка). Интерцептор
        // отвечает только за 401-refresh и офлайн-блок мутаций.
        return Promise.reject(error)
    }
)

export default api
