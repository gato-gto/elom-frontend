// src/stores/ui.ts
import { defineStore } from 'pinia';
export const useUiStore = defineStore('ui', {
    state: () => ({
        pending: 0,
        toasts: [],
        _seq: 1,
    }),
    getters: {
        busy: (s) => s.pending > 0,
    },
    actions: {
        start() {
            this.pending++;
        },
        done() {
            this.pending = Math.max(0, this.pending - 1);
        },
        toast(t) {
            const id = this._seq++;
            const toast = {
                id,
                text: t.text,
                type: t.type ?? 'info',
                timeout: t.timeout ?? 3500,
            };
            this.toasts.push(toast);
            setTimeout(() => this.remove(id), toast.timeout);
        },
        remove(id) {
            this.toasts = this.toasts.filter((x) => x.id !== id);
        },
    },
});
