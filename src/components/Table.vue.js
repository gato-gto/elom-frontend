const props = withDefaults(defineProps(), {
    actions: () => [],
    loading: false,
    emptyText: 'Нет данных',
    sortBy: '',
    sortOrder: 'asc'
});
const emit = defineEmits();
const getRowKey = (row, index) => {
    return row.id || row.key || index;
};
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};
const formatValue = (value, column) => {
    if (column.formatter) {
        return column.formatter(value);
    }
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'boolean') {
        return value ? 'Да' : 'Нет';
    }
    return String(value);
};
const handleSort = (key) => {
    emit('sort', key);
};
const handleAction = (action, row) => {
    emit('action', action, row);
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    actions: () => [],
    loading: false,
    emptyText: 'Нет данных',
    sortBy: '',
    sortOrder: 'asc'
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "overflow-auto border rounded-xl" },
});
__VLS_asFunctionalElement(__VLS_elements.table, __VLS_elements.table)({
    ...{ class: "table table-zebra w-full" },
});
__VLS_asFunctionalElement(__VLS_elements.thead, __VLS_elements.thead)({});
__VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
for (const [column] of __VLS_getVForSourceType((__VLS_ctx.columns))) {
    // @ts-ignore
    [columns,];
    __VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
        key: (column.key),
        ...{ class: "bg-base-200" },
        ...{ class: (column.class) },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "flex items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (column.title);
    if (column.sortable) {
        __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(column.sortable))
                        return;
                    __VLS_ctx.handleSort(column.key);
                    // @ts-ignore
                    [handleSort,];
                } },
            ...{ class: "btn btn-ghost btn-xs" },
        });
        __VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
            ...{ class: "w-3 h-3" },
            ...{ class: ({
                    'opacity-50': __VLS_ctx.sortBy !== column.key,
                    'rotate-180': __VLS_ctx.sortBy === column.key && __VLS_ctx.sortOrder === 'desc'
                }) },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        // @ts-ignore
        [sortBy, sortBy, sortOrder,];
        __VLS_asFunctionalElement(__VLS_elements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M5 15l7-7 7 7",
        });
    }
}
if (__VLS_ctx.actions.length > 0) {
    // @ts-ignore
    [actions,];
    __VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
        ...{ class: "bg-base-200" },
    });
}
__VLS_asFunctionalElement(__VLS_elements.tbody, __VLS_elements.tbody)({});
if (__VLS_ctx.loading) {
    // @ts-ignore
    [loading,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        colspan: (__VLS_ctx.columns.length + (__VLS_ctx.actions.length > 0 ? 1 : 0)),
        ...{ class: "text-center py-8" },
    });
    // @ts-ignore
    [columns, actions,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "loading loading-spinner loading-md" },
    });
}
else if (__VLS_ctx.data.length === 0) {
    // @ts-ignore
    [data,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        colspan: (__VLS_ctx.columns.length + (__VLS_ctx.actions.length > 0 ? 1 : 0)),
        ...{ class: "text-center py-8 text-base-content-60" },
    });
    // @ts-ignore
    [columns, actions,];
    (__VLS_ctx.emptyText);
    // @ts-ignore
    [emptyText,];
}
else {
    for (const [row, index] of __VLS_getVForSourceType((__VLS_ctx.data))) {
        // @ts-ignore
        [data,];
        __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
            key: (__VLS_ctx.getRowKey(row, index)),
        });
        // @ts-ignore
        [getRowKey,];
        for (const [column] of __VLS_getVForSourceType((__VLS_ctx.columns))) {
            // @ts-ignore
            [columns,];
            __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
                key: (column.key),
                ...{ class: (column.class) },
            });
            var __VLS_0 = {
                row: (row),
                value: (__VLS_ctx.getNestedValue(row, column.key)),
                index: (index),
            };
            var __VLS_1 = __VLS_tryAsConstant(`cell-${column.key}`);
            // @ts-ignore
            [getNestedValue,];
            (__VLS_ctx.formatValue(__VLS_ctx.getNestedValue(row, column.key), column));
            // @ts-ignore
            [getNestedValue, formatValue,];
        }
        if (__VLS_ctx.actions.length > 0) {
            // @ts-ignore
            [actions,];
            __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
            __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
                ...{ class: "flex gap-1" },
            });
            for (const [action] of __VLS_getVForSourceType((__VLS_ctx.actions))) {
                // @ts-ignore
                [actions,];
                __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.data.length === 0))
                                return;
                            if (!(__VLS_ctx.actions.length > 0))
                                return;
                            __VLS_ctx.handleAction(action.key, row);
                            // @ts-ignore
                            [handleAction,];
                        } },
                    key: (action.key),
                    ...{ class: "btn btn-ghost btn-xs" },
                    ...{ class: (action.class) },
                    disabled: (action.disabled?.(row)),
                });
                if (action.icon) {
                    const __VLS_4 = ((action.icon));
                    // @ts-ignore
                    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
                        ...{ class: "w-3 h-3" },
                    }));
                    const __VLS_6 = __VLS_5({
                        ...{ class: "w-3 h-3" },
                    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
                }
                (action.label);
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-zebra']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-200']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rotate-180']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-md']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-60']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
// @ts-ignore
var __VLS_2 = __VLS_1, __VLS_3 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        getRowKey: getRowKey,
        getNestedValue: getNestedValue,
        formatValue: formatValue,
        handleSort: handleSort,
        handleAction: handleAction,
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
