import { ref, watch } from 'vue';
const props = withDefaults(defineProps(), {
    startPlaceholder: 'От',
    endPlaceholder: 'До',
    required: false,
    hasError: false
});
const emit = defineEmits();
const startDate = ref(props.modelValue?.start || '');
const endDate = ref(props.modelValue?.end || '');
const handleStartChange = () => {
    emit('update:modelValue', { start: startDate.value, end: endDate.value });
};
const handleEndChange = () => {
    emit('update:modelValue', { start: startDate.value, end: endDate.value });
};
// Синхронизация с внешними изменениями
watch(() => props.modelValue, (newValue) => {
    startDate.value = newValue?.start || '';
    endDate.value = newValue?.end || '';
}, { deep: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    startPlaceholder: 'От',
    endPlaceholder: 'До',
    required: false,
    hasError: false
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "form-control" },
});
if (__VLS_ctx.label) {
    // @ts-ignore
    [label,];
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "label-text" },
    });
    (__VLS_ctx.label);
    // @ts-ignore
    [label,];
    if (__VLS_ctx.required) {
        // @ts-ignore
        [required,];
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "label-text-alt text-error" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "input-group" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onInput: (__VLS_ctx.handleStartChange) },
    type: "date",
    ...{ class: "input input-bordered input-sm" },
    ...{ class: ({ 'input-error': __VLS_ctx.hasError }) },
    placeholder: (__VLS_ctx.startPlaceholder),
});
(__VLS_ctx.startDate);
// @ts-ignore
[handleStartChange, hasError, startPlaceholder, startDate,];
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "bg-base-200 px-2 flex items-center text-sm" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onInput: (__VLS_ctx.handleEndChange) },
    type: "date",
    ...{ class: "input input-bordered input-sm" },
    ...{ class: ({ 'input-error': __VLS_ctx.hasError }) },
    placeholder: (__VLS_ctx.endPlaceholder),
});
(__VLS_ctx.endDate);
// @ts-ignore
[hasError, handleEndChange, endPlaceholder, endDate,];
if (__VLS_ctx.helpText) {
    // @ts-ignore
    [helpText,];
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "label-text-alt" },
    });
    (__VLS_ctx.helpText);
    // @ts-ignore
    [helpText,];
}
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['input-group']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input-error']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input-error']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        startDate: startDate,
        endDate: endDate,
        handleStartChange: handleStartChange,
        handleEndChange: handleEndChange,
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
