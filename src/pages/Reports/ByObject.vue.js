import { computed, onMounted, ref } from 'vue';
import api from '@/api/client';
import endpoints, { buildQuery } from '@/api/endpoints';
const rows = ref([]);
const loading = ref(false);
const count = ref(0);
const page = ref(1);
const pageSize = 50;
const filters = ref({ date_from: undefined, date_to: undefined, object: undefined, responsible: undefined });
const objects = ref([]);
const employees = ref([]);
const materials = ref([]);
const objMap = computed(() => new Map(objects.value.map(o => [o.id, o.name])));
const matMap = computed(() => new Map(materials.value.map(m => [m.id, m.name])));
function objectName(id) {
    return id ? objMap.value.get(id) : undefined;
}
function materialName(id) {
    return id ? matMap.value.get(id) : undefined;
}
const isPaginated = computed(() => count.value > rows.value.length);
async function loadRefs() {
    const [{ data: od }, { data: ed }, { data: md }] = await Promise.all([
        api.get(endpoints.objects.list + buildQuery({ page_size: 1000, ordering: 'name' })),
        api.get(endpoints.employees.list + buildQuery({ page_size: 1000, ordering: 'username' })),
        api.get(endpoints.materials.list + buildQuery({ page_size: 1000, ordering: 'name' })),
    ]);
    objects.value = od.results;
    employees.value = ed.results;
    materials.value = md.results;
}
async function fetchReport() {
    loading.value = true;
    try {
        const q = { ...filters.value, page: page.value, page_size: pageSize };
        const { data } = await api.get(endpoints.reports.byObject + buildQuery(q));
        if (Array.isArray(data)) {
            rows.value = data;
            count.value = data.length;
        }
        else {
            rows.value = data.rows;
            count.value = data.rows.length;
        }
    }
    finally {
        loading.value = false;
    }
}
function reload(p = page.value) {
    page.value = p;
    fetchReport();
}
const exportUrl = computed(() => {
    const q = { ...filters.value, export: 'xlsx' };
    return endpoints.reports.byObject + buildQuery(q);
});
onMounted(async () => {
    await loadRefs();
    await fetchReport();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "grid gap-4" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_elements.h1, __VLS_elements.h1)({
    ...{ class: "text-lg font-semibold" },
});
__VLS_asFunctionalElement(__VLS_elements.a, __VLS_elements.a)({
    ...{ class: "btn btn-primary" },
    href: (__VLS_ctx.exportUrl),
    target: "_blank",
    rel: "noreferrer",
});
// @ts-ignore
[exportUrl,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card bg-base-100 border" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body grid md:grid-cols-6 gap-4" },
});
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
    ...{ class: "input input-bordered input-sm" },
});
(__VLS_ctx.filters.date_from);
// @ts-ignore
[filters,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
    ...{ class: "input input-bordered input-sm" },
});
(__VLS_ctx.filters.date_to);
// @ts-ignore
[filters,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.filters.object),
    ...{ class: "select select-bordered select-sm" },
});
// @ts-ignore
[filters,];
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: (undefined),
});
for (const [o] of __VLS_getVForSourceType((__VLS_ctx.objects))) {
    // @ts-ignore
    [objects,];
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        key: (o.id),
        value: (o.id),
    });
    (o.name);
}
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.filters.responsible),
    ...{ class: "select select-bordered select-sm" },
});
// @ts-ignore
[filters,];
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: (undefined),
});
for (const [e] of __VLS_getVForSourceType((__VLS_ctx.employees))) {
    // @ts-ignore
    [employees,];
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        key: (e.id),
        value: (e.id),
    });
    (e.first_name || e.username);
    (e.last_name || '');
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "md:col-span-2 flex items-end justify-end" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.reload(1);
            // @ts-ignore
            [reload,];
        } },
    ...{ class: "btn btn-sm btn-outline" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "overflow-auto border border-base-300 rounded-xl" },
});
__VLS_asFunctionalElement(__VLS_elements.table, __VLS_elements.table)({
    ...{ class: "table table-zebra w-full" },
});
__VLS_asFunctionalElement(__VLS_elements.thead, __VLS_elements.thead)({});
__VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
});
__VLS_asFunctionalElement(__VLS_elements.tbody, __VLS_elements.tbody)({});
for (const [r, i] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
    // @ts-ignore
    [rows,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        key: (i),
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (r[0] ?? '—');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (r[1] ?? '—');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (r[2] ?? '—');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (r[3] ?? '—');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (r[4] ?? '—');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "text-right" },
    });
    (r[5] ?? '—');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "text-right" },
    });
    (r[6] ?? '—');
}
if (!__VLS_ctx.loading && __VLS_ctx.rows.length === 0) {
    // @ts-ignore
    [rows, loading,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        colspan: "7",
        ...{ class: "text-center text-base-content-60" },
    });
}
if (__VLS_ctx.isPaginated) {
    // @ts-ignore
    [isPaginated,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "join self-end" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isPaginated))
                    return;
                __VLS_ctx.reload(1);
                // @ts-ignore
                [reload,];
            } },
        ...{ class: "btn btn-sm join-item" },
        disabled: (__VLS_ctx.page <= 1),
    });
    // @ts-ignore
    [page,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isPaginated))
                    return;
                __VLS_ctx.reload(__VLS_ctx.page - 1);
                // @ts-ignore
                [reload, page,];
            } },
        ...{ class: "btn btn-sm join-item" },
        disabled: (__VLS_ctx.page <= 1),
    });
    // @ts-ignore
    [page,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ class: "btn btn-sm join-item btn-ghost no-animation" },
    });
    (__VLS_ctx.page);
    // @ts-ignore
    [page,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isPaginated))
                    return;
                __VLS_ctx.reload(__VLS_ctx.page + 1);
                // @ts-ignore
                [reload, page,];
            } },
        ...{ class: "btn btn-sm join-item" },
        disabled: (__VLS_ctx.page * __VLS_ctx.pageSize >= __VLS_ctx.count),
    });
    // @ts-ignore
    [page, pageSize, count,];
}
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-6']} */ ;
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
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
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
/** @type {__VLS_StyleScopedClasses['join']} */ ;
/** @type {__VLS_StyleScopedClasses['self-end']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['join-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['join-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['join-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['no-animation']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['join-item']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        rows: rows,
        loading: loading,
        count: count,
        page: page,
        pageSize: pageSize,
        filters: filters,
        objects: objects,
        employees: employees,
        isPaginated: isPaginated,
        reload: reload,
        exportUrl: exportUrl,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
