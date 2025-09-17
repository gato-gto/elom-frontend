import { ref, computed, onMounted } from 'vue';
import api from '@/api/client';
import endpoints, { buildQuery } from '@/api/endpoints';
const dateFrom = ref();
const dateTo = ref();
const search = ref('');
const rows = ref([]);
const total = ref(null);
const loading = ref(false);
async function load() {
    loading.value = true;
    try {
        const q = buildQuery({
            date_after: dateFrom.value || undefined,
            date_before: dateTo.value || undefined,
            search: search.value || undefined,
        });
        const { data } = await api.get(endpoints.reports.byPeriod + q);
        rows.value = Array.isArray(data) ? data : (data.rows ?? []);
        total.value = data.total_amount ?? null;
    }
    finally {
        loading.value = false;
    }
}
const xlsxUrl = computed(() => {
    const q = buildQuery({
        date_after: dateFrom.value || undefined,
        date_before: dateTo.value || undefined,
        search: search.value || undefined,
        format: 'xlsx',
    });
    return endpoints.reports.byPeriod + q;
});
const pdfUrl = computed(() => {
    const q = buildQuery({
        date_after: dateFrom.value || undefined,
        date_before: dateTo.value || undefined,
        search: search.value || undefined,
        format: 'pdf',
    });
    return endpoints.reports.byPeriod + q;
});
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "grid gap-4" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card bg-base-100 border" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body grid md:grid-cols-5 gap-4" },
});
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
    for: "rp-from",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    id: "rp-from",
    type: "date",
    ...{ class: "input input-bordered input-sm" },
});
(__VLS_ctx.dateFrom);
// @ts-ignore
[dateFrom,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
    for: "rp-to",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    id: "rp-to",
    type: "date",
    ...{ class: "input input-bordered input-sm" },
});
(__VLS_ctx.dateTo);
// @ts-ignore
[dateTo,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset md:col-span-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
    for: "rp-search",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onKeyup: (__VLS_ctx.load) },
    id: "rp-search",
    ...{ class: "input input-bordered input-sm" },
    placeholder: "поставщик/комментарий/материал",
});
(__VLS_ctx.search);
// @ts-ignore
[load, search,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex items-end gap-2" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.load) },
    ...{ class: "btn btn-sm btn-outline" },
});
// @ts-ignore
[load,];
__VLS_asFunctionalElement(__VLS_elements.a, __VLS_elements.a)({
    ...{ class: "btn btn-sm" },
    href: (__VLS_ctx.xlsxUrl),
    target: "_blank",
    rel: "noreferrer",
});
// @ts-ignore
[xlsxUrl,];
__VLS_asFunctionalElement(__VLS_elements.a, __VLS_elements.a)({
    ...{ class: "btn btn-sm btn-ghost" },
    href: (__VLS_ctx.pdfUrl),
    target: "_blank",
    rel: "noreferrer",
});
// @ts-ignore
[pdfUrl,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "overflow-auto border border-base-300 rounded-xl" },
});
__VLS_asFunctionalElement(__VLS_elements.table, __VLS_elements.table)({
    ...{ class: "table table-zebra w-full" },
});
__VLS_asFunctionalElement(__VLS_elements.thead, __VLS_elements.thead)({});
__VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
});
__VLS_asFunctionalElement(__VLS_elements.tbody, __VLS_elements.tbody)({});
for (const [r] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
    // @ts-ignore
    [rows,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        key: (r.month),
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (r.month);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "text-right" },
    });
    (r.total_amount);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "text-right" },
    });
    (r.purchases_count ?? '—');
}
if (!__VLS_ctx.loading && __VLS_ctx.rows.length === 0) {
    // @ts-ignore
    [rows, loading,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        colspan: "3",
        ...{ class: "text-center text-base-content-60" },
    });
}
if (__VLS_ctx.total) {
    // @ts-ignore
    [total,];
    __VLS_asFunctionalElement(__VLS_elements.tfoot, __VLS_elements.tfoot)({});
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({});
    __VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
        ...{ class: "text-right" },
    });
    (__VLS_ctx.total);
    // @ts-ignore
    [total,];
    __VLS_asFunctionalElement(__VLS_elements.th)({});
}
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-5']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-base-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-zebra']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-60']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        dateFrom: dateFrom,
        dateTo: dateTo,
        search: search,
        rows: rows,
        total: total,
        loading: loading,
        load: load,
        xlsxUrl: xlsxUrl,
        pdfUrl: pdfUrl,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
