import { computed } from 'vue';
const props = withDefaults(defineProps(), {
    maxVisible: 5
});
const emit = defineEmits();
const visiblePages = computed(() => {
    const { currentPage, totalPages, maxVisible } = props;
    const pages = [];
    if (totalPages <= maxVisible) {
        // Показываем все страницы
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    }
    else {
        // Показываем страницы с многоточием
        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        if (start > 1) {
            pages.push(1);
            if (start > 2) {
                pages.push('...');
            }
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push('...');
            }
            pages.push(totalPages);
        }
    }
    return pages;
});
const goToPage = (page) => {
    if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
        emit('page-change', page);
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    maxVisible: 5
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
if (__VLS_ctx.totalPages > 1) {
    // @ts-ignore
    [totalPages,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "flex justify-center" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "btn-group" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPages > 1))
                    return;
                __VLS_ctx.goToPage(1);
                // @ts-ignore
                [goToPage,];
            } },
        ...{ class: "btn btn-sm" },
        disabled: (__VLS_ctx.currentPage === 1),
    });
    // @ts-ignore
    [currentPage,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPages > 1))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.currentPage - 1);
                // @ts-ignore
                [goToPage, currentPage,];
            } },
        ...{ class: "btn btn-sm" },
        disabled: (__VLS_ctx.currentPage === 1),
    });
    // @ts-ignore
    [currentPage,];
    for (const [page] of __VLS_getVForSourceType((__VLS_ctx.visiblePages))) {
        (page);
        // @ts-ignore
        [visiblePages,];
        if (page !== '...') {
            __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.totalPages > 1))
                            return;
                        if (!(page !== '...'))
                            return;
                        __VLS_ctx.goToPage(page);
                        // @ts-ignore
                        [goToPage,];
                    } },
                ...{ class: "btn btn-sm" },
                ...{ class: ({ 'btn-active': page === __VLS_ctx.currentPage }) },
            });
            // @ts-ignore
            [currentPage,];
            (page);
        }
        else {
            __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
                ...{ class: "btn btn-sm btn-disabled" },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPages > 1))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.currentPage + 1);
                // @ts-ignore
                [goToPage, currentPage,];
            } },
        ...{ class: "btn btn-sm" },
        disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    });
    // @ts-ignore
    [totalPages, currentPage,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.totalPages > 1))
                    return;
                __VLS_ctx.goToPage(__VLS_ctx.totalPages);
                // @ts-ignore
                [totalPages, goToPage,];
            } },
        ...{ class: "btn btn-sm" },
        disabled: (__VLS_ctx.currentPage === __VLS_ctx.totalPages),
    });
    // @ts-ignore
    [totalPages, currentPage,];
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-group']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-active']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        visiblePages: visiblePages,
        goToPage: goToPage,
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
