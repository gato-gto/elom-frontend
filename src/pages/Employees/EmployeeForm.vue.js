import { reactive, ref, watchEffect, computed } from 'vue';
import api from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { useUiStore } from '@/stores/ui';
const props = defineProps();
const emit = defineEmits();
const ui = useUiStore();
const form = reactive({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    password: ''
});
const errors = reactive({
    first_name: null,
    last_name: null,
    email: null,
    role: null,
    password: null
});
const submitting = ref(false);
const isFormValid = computed(() => {
    const baseValid = form.first_name.trim() && form.last_name.trim() && form.email.trim() && form.role;
    if (props.initial) {
        return baseValid;
    }
    else {
        return baseValid && form.password.trim();
    }
});
watchEffect(() => {
    if (props.initial) {
        form.first_name = props.initial.first_name;
        form.last_name = props.initial.last_name;
        form.email = props.initial.email;
        form.role = props.initial.role;
        form.password = '';
    }
    else {
        form.first_name = '';
        form.last_name = '';
        form.email = '';
        form.role = '';
        form.password = '';
    }
    // Очищаем ошибки
    Object.keys(errors).forEach(key => errors[key] = null);
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
    // Очищаем ошибки
    Object.keys(errors).forEach(key => errors[key] = null);
    try {
        if (props.initial) {
            const payload = {
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                role: form.role
            };
            await api.patch(endpoints.employees.one(props.initial.id), payload);
            ui.toast({ type: 'success', text: 'Сотрудник обновлен' });
        }
        else {
            const payload = {
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                role: form.role,
                password: form.password
            };
            await api.post(endpoints.employees.list, payload);
            ui.toast({ type: 'success', text: 'Сотрудник создан' });
        }
        emit('saved');
    }
    catch (e) {
        const data = e?.response?.data || {};
        errors.first_name = pickError(data, 'first_name');
        errors.last_name = pickError(data, 'last_name');
        errors.email = pickError(data, 'email');
        errors.role = pickError(data, 'role');
        errors.password = pickError(data, 'password');
        // Если нет конкретных ошибок полей, показываем общую ошибку
        const hasFieldErrors = Object.values(errors).some(error => error !== null);
        if (!hasFieldErrors && data?.detail && typeof data.detail === 'string') {
            errors.email = data.detail;
        }
        if (!hasFieldErrors) {
            ui.toast({ type: 'error', text: 'Ошибка сохранения сотрудника' });
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
    d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
});
(props.initial ? 'Редактировать сотрудника' : 'Новый сотрудник');
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
    value: (__VLS_ctx.form.first_name),
    type: "text",
    ...{ class: "input input-bordered" },
    ...{ class: ({ 'input-error': __VLS_ctx.errors.first_name }) },
    placeholder: "Введите имя",
    required: true,
});
// @ts-ignore
[form, errors,];
if (__VLS_ctx.errors.first_name) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.errors.first_name);
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
    value: (__VLS_ctx.form.last_name),
    type: "text",
    ...{ class: "input input-bordered" },
    ...{ class: ({ 'input-error': __VLS_ctx.errors.last_name }) },
    placeholder: "Введите фамилию",
    required: true,
});
// @ts-ignore
[form, errors,];
if (__VLS_ctx.errors.last_name) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.errors.last_name);
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
    type: "email",
    ...{ class: "input input-bordered" },
    ...{ class: ({ 'input-error': __VLS_ctx.errors.email }) },
    placeholder: "Введите email",
    required: true,
});
(__VLS_ctx.form.email);
// @ts-ignore
[form, errors,];
if (__VLS_ctx.errors.email) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.errors.email);
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
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.form.role),
    ...{ class: "select select-bordered" },
    ...{ class: ({ 'select-error': __VLS_ctx.errors.role }) },
    required: true,
});
// @ts-ignore
[form, errors,];
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "",
    disabled: true,
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "admin",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "director",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "manager",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "employee",
});
if (__VLS_ctx.errors.role) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.errors.role);
    // @ts-ignore
    [errors,];
}
if (!props.initial) {
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
        type: "password",
        ...{ class: "input input-bordered" },
        ...{ class: ({ 'input-error': __VLS_ctx.errors.password }) },
        placeholder: "Введите пароль",
        required: (!props.initial),
    });
    (__VLS_ctx.form.password);
    // @ts-ignore
    [form, errors,];
    if (__VLS_ctx.errors.password) {
        // @ts-ignore
        [errors,];
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "text-xs text-error" },
        });
        (__VLS_ctx.errors.password);
        // @ts-ignore
        [errors,];
    }
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-base-content-60" },
    });
}
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
    disabled: (__VLS_ctx.submitting || !__VLS_ctx.isFormValid),
});
// @ts-ignore
[submitting, isFormValid,];
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
/** @type {__VLS_StyleScopedClasses['input-error']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-error']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
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
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-60']} */ ;
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
        isFormValid: isFormValid,
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
