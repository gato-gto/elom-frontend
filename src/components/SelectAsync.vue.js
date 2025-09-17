import { ref, watch, onMounted } from 'vue';
const props = withDefaults(defineProps(), {
    required: false,
    hasError: false,
    disabled: false,
    loading: false,
    searchable: false,
    debounceMs: 300
});
const emit = defineEmits();
const selectedValue = ref(props.modelValue || '');
const handleChange = () => {
    emit('update:modelValue', selectedValue.value);
};
// Синхронизация с внешними изменениями
watch(() => props.modelValue, (newValue) => {
    selectedValue.value = newValue || '';
});
// Загрузка опций при монтировании
onMounted(() => {
    if (props.searchable && props.options.length === 0) {
        emit('search', '');
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    required: false,
    hasError: false,
    disabled: false,
    loading: false,
    searchable: false,
    debounceMs: 300
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
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    ...{ onChange: (__VLS_ctx.handleChange) },
    value: (__VLS_ctx.selectedValue),
    ...{ class: "select select-bordered select-sm" },
    ...{ class: ({ 'select-error': __VLS_ctx.hasError }) },
    disabled: (__VLS_ctx.loading || __VLS_ctx.disabled),
});
// @ts-ignore
[handleChange, selectedValue, hasError, loading, disabled,];
if (__VLS_ctx.placeholder) {
    // @ts-ignore
    [placeholder,];
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        value: "",
        disabled: true,
    });
    (__VLS_ctx.placeholder);
    // @ts-ignore
    [placeholder,];
}
for (const [option] of __VLS_getVForSourceType((__VLS_ctx.options))) {
    // @ts-ignore
    [options,];
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        key: (option.value),
        value: (option.value),
    });
    (option.label);
}
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
if (__VLS_ctx.loading) {
    // @ts-ignore
    [loading,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "loading loading-spinner loading-sm mt-2" },
    });
}
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['select-error']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        selectedValue: selectedValue,
        handleChange: handleChange,
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
