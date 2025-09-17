import { computed, ref, onMounted } from 'vue';
import api from '@/api/client';
import endpoints, { buildQuery } from '@/api/endpoints';
const rows = ref([]);
const count = ref(0);
const page = ref(1);
const pageSize = 20;
const loading = ref(false);
const busyId = ref(null);
const month = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM
const objectId = ref();
const objects = ref([]);
async function loadRefs() {
    const { data } = await api.get(endpoints.objects.list + buildQuery({ page_size: 1000, ordering: 'name' }));
    objects.value = data.results;
}
async function fetchList() {
    loading.value = true;
    try {
        const q = {
            page: page.value,
            page_size: pageSize,
            month: month.value,
            object: objectId.value,
        };
        const { data } = await api.get(endpoints.archive.periods.list + buildQuery(q));
        rows.value = data.results;
        count.value = data.count;
    }
    finally {
        loading.value = false;
    }
}
function reload(p = page.value) {
    page.value = p;
    fetchList();
}
// --- Закрытие/открытие периодов ---
const dlg = ref(null);
const closeMonth = ref(null); // YYYY-MM
const closeObjectId = ref(undefined);
const closing = ref(false);
const canClose = computed(() => !!closeMonth.value && !!closeObjectId.value);
function openCloseModal() {
    closeMonth.value = month.value ?? new Date().toISOString().slice(0, 7);
    closeObjectId.value = objectId.value;
    dlg.value?.showModal();
}
function closeDialog() {
    dlg.value?.close();
}
async function closePeriod() {
    if (!canClose.value)
        return;
    closing.value = true;
    try {
        const payload = { month: closeMonth.value, object: closeObjectId.value };
        await api.post(endpoints.archive.close, payload);
        closeDialog();
        await fetchList();
    }
    finally {
        closing.value = false;
    }
}
async function reopen(p) {
    if (!p.is_closed)
        return;
    if (!confirm(`Открыть период ${p.month} по объекту "${p.object_name ?? p.object}"?`))
        return;
    busyId.value = p.id;
    try {
        // По спецификации ReopenRequest = {month, object}
        await api.post(endpoints.archive.reopen, { month: p.month, object: p.object });
        await fetchList();
    }
    finally {
        busyId.value = null;
    }
}
onMounted(async () => {
    await loadRefs();
    await fetchList();
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
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.openCloseModal) },
    ...{ class: "btn btn-primary" },
});
// @ts-ignore
[openCloseModal,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card bg-base-100 border" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body grid md:grid-cols-3 gap-4" },
});
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
    for: "ar-month",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    id: "ar-month",
    type: "month",
    ...{ class: "input input-bordered input-sm" },
});
(__VLS_ctx.month);
// @ts-ignore
[month,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
    for: "ar-obj",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    id: "ar-obj",
    value: (__VLS_ctx.objectId),
    ...{ class: "select select-bordered select-sm" },
});
// @ts-ignore
[objectId,];
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
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "md:col-span-1 flex items-end justify-end" },
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
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
});
__VLS_asFunctionalElement(__VLS_elements.tbody, __VLS_elements.tbody)({});
for (const [p] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
    // @ts-ignore
    [rows,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        key: (p.id),
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (p.month);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (p.object_name ?? p.object);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (p.closed_at ?? '—');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "badge" },
        ...{ class: (p.is_closed ? 'badge-ghost' : 'badge-success') },
    });
    (p.is_closed ? 'Закрыт' : 'Открыт');
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "text-right" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.reopen(p);
                // @ts-ignore
                [reopen,];
            } },
        ...{ class: "btn btn-xs btn-warning" },
        disabled: (__VLS_ctx.busyId === p.id || !p.is_closed),
    });
    // @ts-ignore
    [busyId,];
}
if (!__VLS_ctx.loading && __VLS_ctx.rows.length === 0) {
    // @ts-ignore
    [rows, loading,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        colspan: "5",
        ...{ class: "text-center text-base-content-60" },
    });
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "join self-end" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
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
            __VLS_ctx.reload(__VLS_ctx.page + 1);
            // @ts-ignore
            [reload, page,];
        } },
    ...{ class: "btn btn-sm join-item" },
    disabled: (__VLS_ctx.page * __VLS_ctx.pageSize >= __VLS_ctx.count),
});
// @ts-ignore
[page, pageSize, count,];
__VLS_asFunctionalElement(__VLS_elements.dialog, __VLS_elements.dialog)({
    ref: "dlg",
    ...{ class: "modal" },
});
/** @type {typeof __VLS_ctx.dlg} */ ;
// @ts-ignore
[dlg,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "modal-box" },
});
__VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({
    ...{ class: "font-semibold mb-3" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "grid gap-3" },
});
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
    for: "dlg-month",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    id: "dlg-month",
    type: "month",
    ...{ class: "input input-bordered" },
});
(__VLS_ctx.closeMonth);
// @ts-ignore
[closeMonth,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
    for: "dlg-object",
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    id: "dlg-object",
    value: (__VLS_ctx.closeObjectId),
    ...{ class: "select select-bordered" },
});
// @ts-ignore
[closeObjectId,];
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: (undefined),
    disabled: true,
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
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "modal-action" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.closeDialog) },
    ...{ class: "btn btn-ghost" },
});
// @ts-ignore
[closeDialog,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.closePeriod) },
    ...{ class: "btn btn-primary" },
    disabled: (__VLS_ctx.closing || !__VLS_ctx.canClose),
});
// @ts-ignore
[closePeriod, closing, canClose,];
(__VLS_ctx.closing ? 'Закрываем…' : 'Закрыть');
// @ts-ignore
[closing,];
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    method: "dialog",
    ...{ class: "modal-backdrop" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({});
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
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
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
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['md:col-span-1']} */ ;
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
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-warning']} */ ;
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
/** @type {__VLS_StyleScopedClasses['modal']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-box']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-backdrop']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        rows: rows,
        count: count,
        page: page,
        pageSize: pageSize,
        loading: loading,
        busyId: busyId,
        month: month,
        objectId: objectId,
        objects: objects,
        reload: reload,
        dlg: dlg,
        closeMonth: closeMonth,
        closeObjectId: closeObjectId,
        closing: closing,
        canClose: canClose,
        openCloseModal: openCloseModal,
        closeDialog: closeDialog,
        closePeriod: closePeriod,
        reopen: reopen,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
