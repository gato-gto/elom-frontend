import { watch } from 'vue';
const props = withDefaults(defineProps(), {
    title: 'Подтверждение',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    loading: false,
    variant: 'primary'
});
const emit = defineEmits();
const handleConfirm = () => {
    emit('confirm');
};
const handleCancel = () => {
    emit('cancel');
    emit('update:isOpen', false);
};
// Закрытие по Escape
watch(() => props.isOpen, (isOpen) => {
    if (isOpen) {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    title: 'Подтверждение',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    loading: false,
    variant: 'primary'
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.isOpen) {
    // @ts-ignore
    [isOpen,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal modal-open" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-box" },
    });
    __VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({
        ...{ class: "font-bold text-lg" },
    });
    (__VLS_ctx.title);
    // @ts-ignore
    [title,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "py-4" },
    });
    (__VLS_ctx.message);
    // @ts-ignore
    [message,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-action" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.handleCancel) },
        ...{ class: "btn btn-ghost" },
        disabled: (__VLS_ctx.loading),
    });
    // @ts-ignore
    [handleCancel, loading,];
    (__VLS_ctx.cancelText);
    // @ts-ignore
    [cancelText,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.handleConfirm) },
        ...{ class: "btn btn-primary" },
        ...{ class: ({ 'loading': __VLS_ctx.loading }) },
        disabled: (__VLS_ctx.loading),
    });
    // @ts-ignore
    [loading, loading, handleConfirm,];
    if (!__VLS_ctx.loading) {
        // @ts-ignore
        [loading,];
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
        (__VLS_ctx.confirmText);
        // @ts-ignore
        [confirmText,];
    }
}
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-open']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-box']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        handleConfirm: handleConfirm,
        handleCancel: handleCancel,
    }),
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
