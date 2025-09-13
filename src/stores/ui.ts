// src/stores/ui.ts
import {defineStore} from 'pinia'

export type Toast = {
    id: number
    type?: 'success' | 'error' | 'info'
    text: string
    timeout?: number
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
            const id = this._seq++
            const toast: Toast = {
                id,
                text: t.text,
                type: t.type ?? 'info',
                timeout: t.timeout ?? 3500,
            }
            this.toasts.push(toast)
            setTimeout(() => this.remove(id), toast.timeout)
        },
        remove(id: number) {
            this.toasts = this.toasts.filter((x) => x.id !== id)
        },
    },
})
