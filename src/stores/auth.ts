// src/stores/auth.ts
import {defineStore} from 'pinia'
import api from '@/api/client'
import {endpoints} from '@/api/endpoints'
import type {Me} from '@/api/types'

type Tokens = { access: string; refresh: string }

const ACCESS_KEY = 'elom_access'
const REFRESH_KEY = 'elom_refresh'

declare global {
    interface Window {
        __piniaStores?: any
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem(ACCESS_KEY),
        refreshToken: localStorage.getItem(REFRESH_KEY),
        me: null as Me | null,
        loading: false,
        error: '' as string | null,
    }),
    getters: {
        isAuthenticated: (s) => Boolean(s.accessToken && s.refreshToken),
        role: (s) => s.me?.role ?? null,
    },
    actions: {
        async tryHydrate() {
            this.error = null
            if (!this.isAuthenticated) return
            try {
                await this.fetchMe()
            } catch {
                this.logout()
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
                this.error = e?.response?.data?.detail || 'Ошибка авторизации'
                this.clearTokens()
                return false
            } finally {
                this.loading = false
            }
        },

        async fetchMe() {
            const {data} = await api.get<Me>(endpoints.auth.me)
            this.me = data
        },

        async refreshTokens(): Promise<string | null> {
            try {
                if (!this.refreshToken) return null
                const {data} = await api.post<Tokens>(endpoints.auth.refresh, {refresh: this.refreshToken})
                // simplejwt может возвращать только access или пару; учитываем оба
                if ((data as any).refresh) {
                    this.setTokens({access: data.access, refresh: (data as any).refresh})
                } else {
                    this.setTokens({access: data.access, refresh: this.refreshToken})
                }
                return this.accessToken
            } catch {
                this.clearTokens()
                return null
            }
        },

        logout(withRedirect = false) {
            this.me = null
            this.clearTokens()
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

        clearTokens() {
            this.accessToken = null
            this.refreshToken = null
            localStorage.removeItem(ACCESS_KEY)
            localStorage.removeItem(REFRESH_KEY)
        },
    },
})

// доступ из axios без циклического импорта
if (!window.__piniaStores) window.__piniaStores = {}
window.__piniaStores.auth = {useAuthStore}
