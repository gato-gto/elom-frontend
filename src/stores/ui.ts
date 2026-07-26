// src/stores/ui.ts
import {defineStore} from 'pinia'

export type Toast = {
    id: number
    type?: 'success' | 'error' | 'info'
    text: string
    timeout?: number
    _ts?: number   // F-558: время добавления — для подавления мгновенных дублей
}
type ToastInput = Omit<Toast, 'id'>

export const useUiStore = defineStore('ui', {
    state: () => ({
        pending: 0,
        toasts: [] as Toast[],
        _seq: 1,
    }),
    getters: {
        busy: (s) => s.pending > 0,
    },
    actions: {
        start() {
            this.pending++
        },
        done() {
            this.pending = Math.max(0, this.pending - 1)
        },
        toast(t: ToastInput) {
            const type = t.type ?? 'info'
            const now = Date.now()
            // F-558: подавляем СЛУЧАЙНЫЕ дубли — стор и страница нередко тостят один и тот же
            // текст подряд (напр. сбой загрузки списка: base.ts fetchList + onMounted страницы).
            // Пропускаем, если такой же текст+тип уже показан в последние 800мс. Осознанные
            // повторы (клики пользователя) разнесены во времени сильнее и не подавляются.
            const dup = this.toasts.some(
                (x) => x.text === t.text && x.type === type && now - (x._ts ?? 0) < 800,
            )
            if (dup) { return }
            const id = this._seq++
            const toast: Toast = {
                id,
                text: t.text,
                type,
                timeout: t.timeout ?? 3500,
                _ts: now,
            }
            this.toasts.push(toast)
            setTimeout(() => this.remove(id), toast.timeout)
        },
        remove(id: number) {
            this.toasts = this.toasts.filter((x) => x.id !== id)
        },
    },
})
