// src/api/client.ts
import axios from 'axios';
import { endpoints, API_PREFIX } from './endpoints';
// Глобальные ключи (совпадают со стором)
const ACCESS_KEY = 'elom_access';
const REFRESH_KEY = 'elom_refresh';
function authStoreSafe() {
    try {
        return window.__piniaStores?.auth?.useAuthStore?.();
    }
    catch {
        return null;
    }
}
function uiStoreSafe() {
    try {
        return window.__piniaStores?.ui?.useUiStore?.();
    }
    catch {
        return null;
    }
}
// Работа с токенами через localStorage (и стор, если есть)
function getAccessToken() {
    const s = authStoreSafe();
    if (s?.accessToken)
        return s.accessToken;
    return localStorage.getItem(ACCESS_KEY);
}
function getRefreshToken() {
    const s = authStoreSafe();
    if (s?.refreshToken)
        return s.refreshToken;
    return localStorage.getItem(REFRESH_KEY);
}
function setTokens(access, refresh) {
    const s = authStoreSafe();
    if (s?.saveTokens && access && refresh) {
        s.saveTokens({ access, refresh });
        return;
    }
    if (access)
        localStorage.setItem(ACCESS_KEY, access);
    if (refresh)
        localStorage.setItem(REFRESH_KEY, refresh);
}
function clearTokensAndLogout() {
    const s = authStoreSafe();
    if (s?.logout) {
        // важно: без аргументов (исправление ошибки TS2554)
        s.logout();
    }
    else {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
    }
}
// Единый axios-клиент
const api = axios.create({
    baseURL: API_PREFIX,
    withCredentials: false,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
});
// ---- Refresh очередь --------------------------------------------------------
let isRefreshing = false;
let refreshPromise = null;
let subscribers = [];
function subscribeTokenRefresh(cb) {
    subscribers.push(cb);
}
function onRefreshed(token) {
    subscribers.forEach((cb) => cb(token));
    subscribers = [];
}
/**
 * Обновление access-токена.
 * ВАЖНО: возвращает строго string | null (исправление TS2322).
 */
async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh)
        return null;
    if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = (async () => {
            try {
                const { data } = await axios.post(endpoints.auth.refresh, { refresh });
                const nextAccess = data.access;
                const nextRefresh = data.refresh ?? refresh;
                setTokens(nextAccess, nextRefresh);
                return nextAccess;
            }
            catch {
                clearTokensAndLogout();
                return null;
            }
            finally {
                isRefreshing = false;
            }
        })();
    }
    const newAccess = await refreshPromise;
    // важно: вернуть значение, а не "void"
    return newAccess;
}
// ---- Interceptors -----------------------------------------------------------
api.interceptors.request.use((config) => {
    try {
        uiStoreSafe()?.start?.();
    }
    catch {
    }
    const access = getAccessToken();
    if (access) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
});
api.interceptors.response.use((r) => {
    try {
        uiStoreSafe()?.done?.();
    }
    catch {
    }
    return r;
}, async (error) => {
    const { response, config } = error;
    try {
        // завершить прогресс и при ошибке
        uiStoreSafe()?.done?.();
    }
    catch {
    }
    // Попытка рефреша при 401
    if (response?.status === 401 && config && !config._retry) {
        ;
        config._retry = true;
        // Если это запрос на refresh, не пытаемся обновить токен
        if (config.url?.includes('/token/refresh/')) {
            return Promise.reject(error);
        }
        const newToken = await refreshAccessToken();
        if (!newToken) {
            // Если не удалось обновить токен, показываем сообщение пользователю
            try {
                const ui = uiStoreSafe();
                if (ui?.toast) {
                    ui.toast({ type: 'error', text: 'Сессия истекла. Пожалуйста, войдите снова.' });
                }
            }
            catch {
                // Игнорируем ошибки UI
            }
            return Promise.reject(error);
        }
        // Обновляем заголовок авторизации и повторяем запрос
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${newToken}`;
        return api(config);
    }
    // Обработка других ошибок
    if (response?.status && response.status >= 500) {
        try {
            const ui = uiStoreSafe();
            if (ui?.toast) {
                ui.toast({ type: 'error', text: 'Ошибка сервера. Попробуйте позже.' });
            }
        }
        catch {
            // Игнорируем ошибки UI
        }
    }
    else if (response?.status === 403) {
        try {
            const ui = uiStoreSafe();
            if (ui?.toast) {
                ui.toast({ type: 'error', text: 'Недостаточно прав для выполнения операции.' });
            }
        }
        catch {
            // Игнорируем ошибки UI
        }
    }
    else if (response?.status === 404) {
        try {
            const ui = uiStoreSafe();
            if (ui?.toast) {
                ui.toast({ type: 'error', text: 'Запрашиваемый ресурс не найден.' });
            }
        }
        catch {
            // Игнорируем ошибки UI
        }
    }
    return Promise.reject(error);
});
export default api;
