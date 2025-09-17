import { reactive, ref, watchEffect } from 'vue';
import api from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { useUiStore } from '@/stores/ui';
const props = defineProps();
const emit = defineEmits();
const ui = useUiStore();
const form = reactive({ name: '', code: '' });
const errors = reactive({ name: null, code: null });
const submitting = ref(false);
watchEffect(() => {
    if (props.initial) {
        form.name = props.initial.name;
        form.code = props.initial.code;
    }
    else {
        form.name = '';
        form.code = '';
    }
    errors.name = null;
    errors.code = null;
});
function pickError(payload, key) {
    const v = payload?.[key];
    if (Array.isArray(v) && v.length)
        return String(v[0]);
    if (typeof v === 'string')
        return v;
    const nested = payload?.errors?.[key];
    if (Array.isArray(nested) && nested.length)
        return String(nested[0]);
    if (typeof nested === 'string')
        return nested;
    return null;
}
async function submit() {
    submitting.value = true;
    errors.name = null;
    errors.code = null;
    try {
        if (props.initial) {
            const payload = {
                name: form.name,
                code: form.code
            };
            await api.patch(endpoints.units.one(props.initial.id), payload);
            ui.toast({ type: 'success', text: 'Единица измерения обновлена' });
        }
        else {
            const payload = {
                name: form.name,
                code: form.code
            };
            await api.post(endpoints.units.list, payload);
            ui.toast({ type: 'success', text: 'Единица измерения создана' });
        }
        emit('saved');
    }
    catch (e) {
        const data = e?.response?.data || {};
        errors.name = pickError(data, 'name');
        errors.code = pickError(data, 'code');
        if (!errors.name && !errors.code && data?.detail && typeof data.detail === 'string') {
            errors.name = data.detail;
        }
        if (!errors.name && !errors.code) {
            ui.toast({ type: 'error', text: 'Ошибка сохранения единицы измерения' });
        }
    }
    finally {
        submitting.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card bg-base-100 shadow-xl" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({
    ...{ class: "card-title text-2xl mb-6" },
});
__VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
    ...{ class: "w-6 h-6" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_elements.path, __VLS_elements.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
});
(props.initial ? 'Редактировать единицу' : 'Новая единица измерения');
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    ...{ onSubmit: (__VLS_ctx.submit) },
    ...{ class: "space-y-6" },
});
// @ts-ignore
[submit,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "grid gap-1" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-sm font-semibold" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-error" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    value: (__VLS_ctx.form.name),
    type: "text",
    ...{ class: "input input-bordered" },
    ...{ class: ({ 'input-error': __VLS_ctx.errors.name }) },
    placeholder: "Введите название единицы измерения",
    required: true,
});
// @ts-ignore
[form, errors,];
if (__VLS_ctx.errors.name) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.errors.name);
    // @ts-ignore
    [errors,];
}
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "grid gap-1" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-sm font-semibold" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-error" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    value: (__VLS_ctx.form.code),
    type: "text",
    ...{ class: "input input-bordered font-mono" },
    ...{ class: ({ 'input-error': __VLS_ctx.errors.code }) },
    placeholder: "Введите код единицы (например: кг, м, шт)",
    required: true,
});
// @ts-ignore
[form, errors,];
if (__VLS_ctx.errors.code) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.errors.code);
    // @ts-ignore
    [errors,];
}
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-xs text-base-content-500" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex justify-end gap-2 mt-6" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('cancel');
            // @ts-ignore
            [$emit,];
        } },
    type: "button",
    ...{ class: "btn btn-ghost" },
    disabled: (__VLS_ctx.submitting),
});
// @ts-ignore
[submitting,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    type: "submit",
    ...{ class: "btn btn-primary" },
    disabled: (__VLS_ctx.submitting || !__VLS_ctx.form.name.trim() || !__VLS_ctx.form.code.trim()),
});
// @ts-ignore
[form, form, submitting,];
(__VLS_ctx.submitting ? 'Сохранение...' : (props.initial ? 'Обновить' : 'Создать'));
// @ts-ignore
[submitting,];
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-error']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['input-error']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        form: form,
        errors: errors,
        submitting: submitting,
        submit: submit,
    }),
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
