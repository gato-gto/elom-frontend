// src/stores/auth.ts
import {defineStore} from 'pinia'
import api, { refreshAccessToken } from '@/api/client'
import {endpoints} from '@/api/endpoints'
import { parseApiError } from '@/utils/errorHandler'
import { usePermissionsStore } from '@/stores/permissions'
import type { Me } from '@/api/types/employees'

type Tokens = { access: string; refresh: string }

const ACCESS_KEY = 'elom_access'
const REFRESH_KEY = 'elom_refresh'


export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem(ACCESS_KEY),
        refreshToken: localStorage.getItem(REFRESH_KEY),
        me: null as Me | null,
        loading: false,
        error: '' as string | null,
        initialized: false,
    }),
    getters: {
        isAuthenticated: (s) => Boolean(s.accessToken && s.refreshToken),
        role: (s) => {
            // ✅ RBAC: Возвращаем первую роль из массива roles для обратной совместимости
            // Используется только как fallback, основной доступ через permissions
            if (s.me?.roles && s.me.roles.length > 0) {
                return s.me.roles[0].name
            }
            return null
        },
    },
    actions: {
        async tryHydrate() {
            this.error = null
            this.initialized = false
            
            if (!this.isAuthenticated) {
                this.initialized = true
                return
            }
            
            try {
                await this.fetchMe()
            } catch (e: any) {
                // Если токен истек, пытаемся обновить
                if (e?.response?.status === 401) {
                    const newToken = await this.refreshTokens()
                    if (newToken) {
                        try {
                            await this.fetchMe()
                            this.initialized = true
                            return
                        } catch {
                            // Если и после обновления не удалось получить данные пользователя
                        }
                    }
                }
                this.logout()
            } finally {
                this.initialized = true
            }
        },

        async login(username: string, password: string): Promise<boolean> {
            this.loading = true
            this.error = null
            try {
                const {data} = await api.post<Tokens>(endpoints.auth.token, {username, password})
                this.setTokens(data)
                await this.fetchMe()
                return true
            } catch (e: any) {
                // EH-FE-12 (F-555): вход, 401 = неверные учётные данные — свой локализованный
                // текст вместо passthrough англ. DRF detail («No active account found…»).
                const parsedError = parseApiError(e)
                this.error = e?.response?.status === 401
                    ? 'Неверный логин или пароль'
                    : parsedError.detail
                this.clearTokens()
                return false
            } finally {
                this.loading = false
            }
        },

        /**
         * F-1021: self-service смена пароля (BE F-777, POST /users/me/password → 204).
         * BE отзывает ВСЕ refresh-токены (в т.ч. текущей сессии) → сразу перелогиниваемся новым
         * паролем, чтобы сессия не умерла через ≤30 мин на первом refresh. Ошибки полей пробрасываем
         * наверх (модалка раскладывает old_password/new_password).
         */
        async changePassword(oldPassword: string, newPassword: string): Promise<void> {
            await api.post(endpoints.users.mePassword, {old_password: oldPassword, new_password: newPassword})
            const username = this.me?.username
            if (username) {
                const ok = await this.login(username, newPassword)
                if (!ok) { await this.fetchMe() }
            } else {
                await this.fetchMe()
            }
            if (this.me) { this.me.must_change_password = false }
        },

        async fetchMe() {
            const {data} = await api.get<Me>(endpoints.users.me)
            this.me = data
            // Загружаем разрешения после получения данных пользователя
            const { usePermissionsStore } = await import('@/stores/permissions')
            const permissionsStore = usePermissionsStore()
            await permissionsStore.fetchPermissions()
        },

        // FE-1: делегируем в ЕДИНУЮ точку refresh (client.ts). Раньше здесь был второй
        // независимый поток через `api` без общего лока — при ротации refresh-токена он
        // конфликтовал с рефрешем из интерцептора и выкидывал пользователя. Общий лок
        // isRefreshing/refreshPromise теперь один на всё приложение. Чтение/запись токенов
        // внутри refreshAccessToken идут через тот же стор (localStorage + Pinia).
        async refreshTokens(): Promise<string | null> {
            return refreshAccessToken()
        },

        logout(withRedirect = false) {
            this.me = null
            this.clearTokens()
            // F-525: чистим кэш прав. Без этого при logout БЕЗ перезагрузки (withRedirect=false)
            // in-memory права оставались, и следующий пользователь мог увидеть старое меню.
            try { usePermissionsStore().clearCache() } catch { /* стор мог быть не готов */ }
            this.initialized = true
            if (withRedirect) {
                const current = encodeURIComponent(location.pathname + location.search)
                location.replace(`/login?session=expired&redirect=${current}`)
            }
        },

        setTokens(t: Tokens) {
            this.accessToken = t.access
            this.refreshToken = t.refresh
            localStorage.setItem(ACCESS_KEY, t.access)
            localStorage.setItem(REFRESH_KEY, t.refresh)
        },

        saveTokens(t: { access: string; refresh: string }) {
            this.setTokens(t)
        },

        clearTokens() {
            this.accessToken = null
            this.refreshToken = null
            localStorage.removeItem(ACCESS_KEY)
            localStorage.removeItem(REFRESH_KEY)
        },
    },
})

// Stores регистрируются в main.ts
