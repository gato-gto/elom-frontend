import { ref, computed, onMounted } from 'vue';
const STORAGE_KEY = 'theme';
const themes = [
    { value: 'light', label: 'Светлая' },
    { value: 'dark', label: 'Тёмная' },
];
const theme = ref('light');
const activeLabel = computed(() => themes.find(t => t.value === theme.value)?.label ?? '');
function applyTheme(v) {
    document.documentElement.setAttribute('data-theme', v);
}
function setTheme(v) {
    theme.value = v;
    localStorage.setItem(STORAGE_KEY, v);
    applyTheme(v);
}
onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && themes.some(t => t.value === saved))
        theme.value = saved;
    applyTheme(theme.value);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "dropdown dropdown-end" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    tabindex: "0",
    role: "button",
    ...{ class: "btn btn-ghost btn-sm" },
});
__VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    ...{ class: "h-4 w-4" },
    viewBox: "0 0 24 24",
    fill: "currentColor",
});
__VLS_asFunctionalElement(__VLS_elements.path)({
    d: "M12 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm5.66 2.34a1 1 0 0 1 1.41 0l.71.71a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41ZM21 11h-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2ZM6.34 5.34a1 1 0 0 0 0 1.41l-.71.71A1 1 0 1 0 7.05 8.9l.71-.71a1 1 0 1 0-1.41-1.41ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM4 13H3a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2Zm1.05 4.95a1 1 0 0 0 0 1.41l-.71.71a1 1 0 0 0 1.41 0l.71-.71a1 1 0 0 0 0-1.41ZM21 18.78a1 1 0 1 1-1.41 1.41l-.71-.71a1 1 0 1 1 1.41-1.41l.71.71Z",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "ml-2 hidden sm:inline text-xs" },
});
(__VLS_ctx.activeLabel);
// @ts-ignore
[activeLabel,];
__VLS_asFunctionalElement(__VLS_elements.ul, __VLS_elements.ul)({
    tabindex: "0",
    ...{ class: "dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44 z-50" },
});
for (const [t] of __VLS_getVForSourceType((__VLS_ctx.themes))) {
    // @ts-ignore
    [themes,];
    __VLS_asFunctionalElement(__VLS_elements.li, __VLS_elements.li)({
        key: (t.value),
    });
    __VLS_asFunctionalElement(__VLS_elements.a, __VLS_elements.a)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.setTheme(t.value);
                // @ts-ignore
                [setTheme,];
            } },
        ...{ class: ({ active: __VLS_ctx.theme === t.value }) },
    });
    // @ts-ignore
    [theme,];
    (t.label);
}
/** @type {__VLS_StyleScopedClasses['dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-end']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:inline']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-content']} */ ;
/** @type {__VLS_StyleScopedClasses['menu']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-box']} */ ;
/** @type {__VLS_StyleScopedClasses['w-44']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        themes: themes,
        theme: theme,
        activeLabel: activeLabel,
        setTheme: setTheme,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
