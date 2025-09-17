import { computed, ref, watch } from 'vue';
const props = defineProps();
const emit = defineEmits();
const fileEl = ref(null);
const error = ref(null);
const fileName = computed(() => props.modelValue?.name || null);
const hasFile = computed(() => !!props.modelValue);
const previewUrl = computed(() => {
    if (props.modelValue)
        return URL.createObjectURL(props.modelValue);
    return props.existingUrl || null;
});
watch(() => props.modelValue, (f) => {
    if (!f)
        error.value = null;
});
function onChange(e) {
    const input = e.target;
    const file = input.files?.[0] || null;
    if (!file) {
        emit('update:modelValue', null);
        return;
    }
    const max = (props.maxSizeMb ?? 8) * 1024 * 1024;
    if (file.size > max) {
        error.value = `Размер файла превышает ${(props.maxSizeMb ?? 8)} MB`;
        input.value = '';
        return;
    }
    const accept = props.accept || 'image/*';
    if (accept.includes('image') && !file.type.startsWith('image/')) {
        error.value = 'Неверный тип файла';
        input.value = '';
        return;
    }
    error.value = null;
    emit('update:modelValue', file);
}
function clear() {
    emit('update:modelValue', null);
    if (fileEl.value)
        fileEl.value.value = '';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "grid gap-2" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onChange: (__VLS_ctx.onChange) },
    ref: "fileEl",
    type: "file",
    accept: (__VLS_ctx.accept || 'image/*'),
    ...{ class: "file-input file-input-bordered file-input-sm w-full max-w-xs" },
});
/** @type {typeof __VLS_ctx.fileEl} */ ;
// @ts-ignore
[onChange, accept, fileEl,];
if (__VLS_ctx.previewUrl) {
    // @ts-ignore
    [previewUrl,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "rounded-xl border bg-base-100 p-2 w-full max-w-xs" },
    });
    __VLS_asFunctionalElement(__VLS_elements.img)({
        src: (__VLS_ctx.previewUrl),
        alt: "preview",
        ...{ class: "w-full h-40 object-contain bg-base-200 rounded-lg" },
    });
    // @ts-ignore
    [previewUrl,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex items-center gap-2" },
});
if (__VLS_ctx.hasFile) {
    // @ts-ignore
    [hasFile,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.clear) },
        type: "button",
        ...{ class: "btn btn-ghost btn-sm" },
    });
    // @ts-ignore
    [clear,];
}
if (__VLS_ctx.fileName) {
    // @ts-ignore
    [fileName,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs opacity-70 truncate max-w-[16rem]" },
    });
    (__VLS_ctx.fileName);
    // @ts-ignore
    [fileName,];
}
if (__VLS_ctx.error) {
    // @ts-ignore
    [error,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.error);
    // @ts-ignore
    [error,];
}
__VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
    ...{ class: "text-xs opacity-60" },
});
(__VLS_ctx.accept || 'image/*');
(__VLS_ctx.maxSizeMb);
// @ts-ignore
[accept, maxSizeMb,];
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-[16rem]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        fileEl: fileEl,
        error: error,
        fileName: fileName,
        hasFile: hasFile,
        previewUrl: previewUrl,
        onChange: onChange,
        clear: clear,
    }),
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
