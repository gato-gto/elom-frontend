const props = withDefaults(defineProps(), {
    type: 'input',
    inputType: 'text',
    required: false,
    disabled: false,
    readonly: false,
    hasError: false,
    options: () => [],
    rows: 3,
    multiple: false
});
const emit = defineEmits();
const handleInput = (event) => {
    const target = event.target;
    let value = target.value;
    if (props.type === 'checkbox') {
        value = target.checked;
    }
    else if (props.type === 'radio') {
        value = target.value;
    }
    emit('update:modelValue', value);
};
const handleBlur = () => {
    emit('blur');
};
const handleFileChange = (event) => {
    const target = event.target;
    const files = target.files;
    if (files) {
        emit('update:modelValue', props.multiple ? Array.from(files) : files[0]);
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    type: 'input',
    inputType: 'text',
    required: false,
    disabled: false,
    readonly: false,
    hasError: false,
    options: () => [],
    rows: 3,
    multiple: false
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
if (__VLS_ctx.type === 'input') {
    // @ts-ignore
    [type,];
    __VLS_asFunctionalElement(__VLS_elements.input)({
        ...{ onInput: (__VLS_ctx.handleInput) },
        ...{ onBlur: (__VLS_ctx.handleBlur) },
        value: (__VLS_ctx.modelValue),
        type: (__VLS_ctx.inputType),
        ...{ class: "input input-bordered input-sm" },
        ...{ class: ({ 'input-error': __VLS_ctx.hasError }) },
        placeholder: (__VLS_ctx.placeholder),
        disabled: (__VLS_ctx.disabled),
        readonly: (__VLS_ctx.readonly),
    });
    // @ts-ignore
    [handleInput, handleBlur, modelValue, inputType, hasError, placeholder, disabled, readonly,];
}
else if (__VLS_ctx.type === 'textarea') {
    // @ts-ignore
    [type,];
    __VLS_asFunctionalElement(__VLS_elements.textarea, __VLS_elements.textarea)({
        ...{ onInput: (__VLS_ctx.handleInput) },
        ...{ onBlur: (__VLS_ctx.handleBlur) },
        value: (__VLS_ctx.modelValue),
        ...{ class: "textarea textarea-bordered textarea-sm" },
        ...{ class: ({ 'textarea-error': __VLS_ctx.hasError }) },
        placeholder: (__VLS_ctx.placeholder),
        disabled: (__VLS_ctx.disabled),
        readonly: (__VLS_ctx.readonly),
        rows: (__VLS_ctx.rows),
    });
    // @ts-ignore
    [handleInput, handleBlur, modelValue, hasError, placeholder, disabled, readonly, rows,];
}
else if (__VLS_ctx.type === 'select') {
    // @ts-ignore
    [type,];
    __VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
        ...{ onChange: (__VLS_ctx.handleInput) },
        value: (__VLS_ctx.modelValue),
        ...{ class: "select select-bordered select-sm" },
        ...{ class: ({ 'select-error': __VLS_ctx.hasError }) },
        disabled: (__VLS_ctx.disabled),
    });
    // @ts-ignore
    [handleInput, modelValue, hasError, disabled,];
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
}
else if (__VLS_ctx.type === 'file') {
    // @ts-ignore
    [type,];
    __VLS_asFunctionalElement(__VLS_elements.input)({
        ...{ onChange: (__VLS_ctx.handleFileChange) },
        type: "file",
        ...{ class: "file-input file-input-bordered file-input-sm w-full" },
        ...{ class: ({ 'file-input-error': __VLS_ctx.hasError }) },
        accept: (__VLS_ctx.accept),
        multiple: (__VLS_ctx.multiple),
        disabled: (__VLS_ctx.disabled),
    });
    // @ts-ignore
    [hasError, disabled, handleFileChange, accept, multiple,];
}
else if (__VLS_ctx.type === 'checkbox') {
    // @ts-ignore
    [type,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "form-control" },
    });
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
        ...{ class: "label cursor-pointer" },
    });
    __VLS_asFunctionalElement(__VLS_elements.input)({
        ...{ onChange: (__VLS_ctx.handleInput) },
        checked: (__VLS_ctx.modelValue),
        type: "checkbox",
        ...{ class: "checkbox checkbox-sm" },
        ...{ class: ({ 'checkbox-error': __VLS_ctx.hasError }) },
        disabled: (__VLS_ctx.disabled),
    });
    // @ts-ignore
    [handleInput, modelValue, hasError, disabled,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "label-text ml-2" },
    });
    (__VLS_ctx.checkboxLabel || __VLS_ctx.label);
    // @ts-ignore
    [label, checkboxLabel,];
}
else if (__VLS_ctx.type === 'radio') {
    // @ts-ignore
    [type,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "form-control" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "flex flex-wrap gap-4" },
    });
    for (const [option] of __VLS_getVForSourceType((__VLS_ctx.options))) {
        // @ts-ignore
        [options,];
        __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
            key: (option.value),
            ...{ class: "label cursor-pointer" },
        });
        __VLS_asFunctionalElement(__VLS_elements.input)({
            ...{ onChange: (__VLS_ctx.handleInput) },
            checked: (__VLS_ctx.modelValue === option.value),
            type: "radio",
            value: (option.value),
            ...{ class: "radio radio-sm" },
            ...{ class: ({ 'radio-error': __VLS_ctx.hasError }) },
            disabled: (__VLS_ctx.disabled),
        });
        // @ts-ignore
        [handleInput, modelValue, hasError, disabled,];
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "label-text ml-2" },
        });
        (option.label);
    }
}
if (__VLS_ctx.$slots.default) {
    // @ts-ignore
    [$slots,];
    var __VLS_0 = {};
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
if (__VLS_ctx.errorMessage) {
    // @ts-ignore
    [errorMessage,];
    __VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
        ...{ class: "label" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "label-text-alt text-error" },
    });
    (__VLS_ctx.errorMessage);
    // @ts-ignore
    [errorMessage,];
}
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input-error']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea-error']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['select-error']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input-error']} */ ;
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox-error']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['radio']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['radio-error']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        handleInput: handleInput,
        handleBlur: handleBlur,
        handleFileChange: handleFileChange,
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
