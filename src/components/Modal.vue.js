import { computed, watch } from 'vue';
const props = withDefaults(defineProps(), {
    size: 'md',
    closable: true,
    backdrop: true,
    closeOnBackdrop: true
});
const emit = defineEmits();
const sizeClass = computed(() => {
    const sizeMap = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl'
    };
    return sizeMap[props.size];
});
const handleClose = () => {
    emit('close');
    emit('update:modelValue', false);
};
const handleBackdropClick = () => {
    if (props.closeOnBackdrop) {
        handleClose();
    }
};
// Закрытие по Escape
watch(() => props.modelValue, (isOpen) => {
    if (isOpen) {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && props.closable) {
                handleClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    size: 'md',
    closable: true,
    backdrop: true,
    closeOnBackdrop: true
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.modelValue) {
    // @ts-ignore
    [modelValue,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal modal-open" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-box" },
        ...{ class: (__VLS_ctx.sizeClass) },
    });
    // @ts-ignore
    [sizeClass,];
    if (__VLS_ctx.title || __VLS_ctx.$slots.header) {
        // @ts-ignore
        [title, $slots,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "flex items-center justify-between mb-4" },
        });
        if (__VLS_ctx.title) {
            // @ts-ignore
            [title,];
            __VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({
                ...{ class: "font-bold text-lg" },
            });
            (__VLS_ctx.title);
            // @ts-ignore
            [title,];
        }
        var __VLS_0 = {};
        if (__VLS_ctx.closable) {
            // @ts-ignore
            [closable,];
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (__VLS_ctx.handleClose) },
                ...{ class: "btn btn-sm btn-circle btn-ghost" },
            });
            // @ts-ignore
            [handleClose,];
        }
    }
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "modal-content" },
    });
    var __VLS_2 = {};
    if (__VLS_ctx.$slots.footer) {
        // @ts-ignore
        [$slots,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "modal-action" },
        });
        var __VLS_4 = {};
    }
    if (__VLS_ctx.backdrop) {
        // @ts-ignore
        [backdrop,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ onClick: (__VLS_ctx.handleBackdropClick) },
            ...{ class: "modal-backdrop" },
        });
        // @ts-ignore
        [handleBackdropClick,];
    }
}
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-open']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-box']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-circle']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-content']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-action']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2, __VLS_5 = __VLS_4;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        sizeClass: sizeClass,
        handleClose: handleClose,
        handleBackdropClick: handleBackdropClick,
    }),
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
