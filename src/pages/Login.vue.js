import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '@/stores/ui';
const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();
const username = ref('');
const password = ref('');
const sessionExpired = computed(() => route.query.session === 'expired');
onMounted(() => {
    if (auth.isAuthenticated) {
        const redirect = route.query.redirect || '/';
        router.replace(redirect);
    }
});
async function submit() {
    try {
        if (auth.isAuthenticated) {
            const redirect = route.query.redirect || '/';
            await router.replace(redirect);
            return;
        }
        const success = await auth.login(username.value, password.value);
        if (success) {
            ui.toast({ type: 'success', text: 'Добро пожаловать!' });
            const redirect = route.query.redirect || '/';
            await router.replace(redirect);
        }
        else {
            // Ошибка уже установлена в auth.error
            ui.toast({ type: 'error', text: auth.error || 'Ошибка входа' });
        }
    }
    catch (e) {
        ui.toast({ type: 'error', text: e?.response?.data?.detail ?? 'Ошибка входа' });
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "min-h-screen grid place-items-center p-4" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "w-full max-w-md card bg-base-100 border shadow-sm" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body" },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "text-xl font-semibold mb-1" },
});
__VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
    ...{ class: "text-base-content-70 text-sm mb-4" },
});
if (__VLS_ctx.sessionExpired) {
    // @ts-ignore
    [sessionExpired,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "alert alert-warning py-2 mb-3" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
}
if (__VLS_ctx.auth.error) {
    // @ts-ignore
    [auth,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "alert alert-error py-2 mb-3" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (__VLS_ctx.auth.error);
    // @ts-ignore
    [auth,];
}
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    ...{ onSubmit: (__VLS_ctx.submit) },
    ...{ class: "grid gap-3" },
});
// @ts-ignore
[submit,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "form-control" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text mb-1" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ class: "input input-bordered" },
    required: true,
});
(__VLS_ctx.username);
// @ts-ignore
[username,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "form-control" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text mb-1" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "password",
    ...{ class: "input input-bordered" },
    required: true,
});
(__VLS_ctx.password);
// @ts-ignore
[password,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    disabled: (__VLS_ctx.auth.loading),
    ...{ class: "btn btn-primary" },
});
// @ts-ignore
[auth,];
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['place-items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-70']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['alert']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-warning']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['alert']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-error']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        auth: auth,
        username: username,
        password: password,
        sessionExpired: sessionExpired,
        submit: submit,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
