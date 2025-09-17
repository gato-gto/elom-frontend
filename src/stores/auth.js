// src/stores/auth.ts
import { defineStore } from 'pinia';
import api from '@/api/client';
import { endpoints } from '@/api/endpoints';
const ACCESS_KEY = 'elom_access';
const REFRESH_KEY = 'elom_refresh';
export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem(ACCESS_KEY),
        refreshToken: localStorage.getItem(REFRESH_KEY),
        me: null,
        loading: false,
        error: '',
    }),
    getters: {
        isAuthenticated: (s) => Boolean(s.accessToken && s.refreshToken),
        role: (s) => s.me?.role ?? null,
    },
    actions: {
        async tryHydrate() {
            this.error = null;
            if (!this.isAuthenticated)
                return;
            try {
                await this.fetchMe();
            }
            catch (e) {
                // Если токен истек, пытаемся обновить
                if (e?.response?.status === 401) {
                    const newToken = await this.refreshTokens();
                    if (newToken) {
                        try {
                            await this.fetchMe();
                            return;
                        }
                        catch {
                            // Если и после обновления не удалось получить данные пользователя
                        }
                    }
                }
                this.logout();
            }
        },
        async login(username, password) {
            this.loading = true;
            this.error = null;
            try {
                const { data } = await api.post(endpoints.auth.token, { username, password });
                this.setTokens(data);
                await this.fetchMe();
                return true;
            }
            catch (e) {
                this.error = e?.response?.data?.detail || 'Ошибка авторизации';
                this.clearTokens();
                return false;
            }
            finally {
                this.loading = false;
            }
        },
        async fetchMe() {
            const { data } = await api.get(endpoints.users.me);
            this.me = data;
        },
        async refreshTokens() {
            try {
                if (!this.refreshToken)
                    return null;
                const { data } = await api.post(endpoints.auth.refresh, { refresh: this.refreshToken });
                // simplejwt может возвращать только access или пару; учитываем оба
                if (data.refresh) {
                    this.setTokens({ access: data.access, refresh: data.refresh });
                }
                else {
                    this.setTokens({ access: data.access, refresh: this.refreshToken });
                }
                return this.accessToken;
            }
            catch (e) {
                // Если refresh token истек, очищаем все токены
                if (e?.response?.status === 401) {
                    this.clearTokens();
                }
                return null;
            }
        },
        logout(withRedirect = false) {
            this.me = null;
            this.clearTokens();
            if (withRedirect) {
                const current = encodeURIComponent(location.pathname + location.search);
                location.replace(`/login?session=expired&redirect=${current}`);
            }
        },
        setTokens(t) {
            this.accessToken = t.access;
            this.refreshToken = t.refresh;
            localStorage.setItem(ACCESS_KEY, t.access);
            localStorage.setItem(REFRESH_KEY, t.refresh);
        },
        saveTokens(t) {
            this.setTokens(t);
        },
        clearTokens() {
            this.accessToken = null;
            this.refreshToken = null;
            localStorage.removeItem(ACCESS_KEY);
            localStorage.removeItem(REFRESH_KEY);
        },
    },
});
// доступ из axios без циклического импорта
if (!window.__piniaStores)
    window.__piniaStores = {};
window.__piniaStores.auth = { useAuthStore };
