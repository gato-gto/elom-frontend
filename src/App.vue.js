import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import TopbarProgress from '@/components/TopbarProgress.vue';
import ToastCenter from '@/components/ToastCenter.vue';
import AppLayout from '@/layouts/AppLayout.vue';
import { useAuthStore } from '@/stores/auth';
const route = useRoute();
const auth = useAuthStore();
// Show layout for all routes except login
const showLayout = computed(() => {
    return route.name !== 'Login';
});
onMounted(async () => {
    // Инициализируем авторизацию при загрузке приложения
    try {
        await auth.tryHydrate();
    }
    catch (e) {
        // Ошибки авторизации обрабатываются в auth store
        console.warn('Auth initialization failed:', e);
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
/** @type {[typeof TopbarProgress, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(TopbarProgress, new TopbarProgress({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof ToastCenter, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(ToastCenter, new ToastCenter({}));
const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
if (__VLS_ctx.showLayout) {
    // @ts-ignore
    [showLayout,];
    /** @type {[typeof AppLayout, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(AppLayout, new AppLayout({}));
    const __VLS_9 = __VLS_8({}, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
else {
    const __VLS_12 = {}.RouterView;
    /** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
    // @ts-ignore
    RouterView;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({}));
    const __VLS_14 = __VLS_13({}, ...__VLS_functionalComponentArgsRest(__VLS_13));
}
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        TopbarProgress: TopbarProgress,
        ToastCenter: ToastCenter,
        AppLayout: AppLayout,
        showLayout: showLayout,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
