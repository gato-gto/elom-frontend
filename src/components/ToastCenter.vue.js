import { storeToRefs } from 'pinia';
import { useUiStore } from '@/stores/ui';
const ui = useUiStore();
const { toasts } = storeToRefs(ui);
function alertClass(type) {
    switch (type) {
        case 'success':
            return 'alert alert-success';
        case 'error':
            return 'alert alert-error';
        default:
            return 'alert alert-info';
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "toast toast-end toast-bottom z-50" },
});
for (const [t] of __VLS_getVForSourceType((__VLS_ctx.toasts))) {
    // @ts-ignore
    [toasts,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        key: (t.id),
        ...{ class: (__VLS_ctx.alertClass(t.type)) },
    });
    // @ts-ignore
    [alertClass,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (t.text);
}
/** @type {__VLS_StyleScopedClasses['toast']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-end']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        toasts: toasts,
        alertClass: alertClass,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
