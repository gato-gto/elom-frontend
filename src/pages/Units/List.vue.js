import { ref, onMounted, computed } from 'vue';
import api from '@/api/client';
import endpoints, { buildQuery } from '@/api/endpoints';
import UnitForm from './UnitForm.vue';
import Modal from '@/components/Modal.vue';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
const auth = useAuthStore();
const ui = useUiStore();
const canEdit = computed(() => {
    const role = auth.role;
    return role === 'admin' || role === 'director';
});
const rows = ref([]);
const count = ref(0);
const page = ref(1);
const pageSize = 20;
const search = ref('');
const ordering = ref('name');
const loading = ref(false);
const modalOpen = ref(false);
const current = ref(null);
const deletingId = ref(null);
function openCreate() {
    current.value = null;
    modalOpen.value = true;
}
function openEdit(u) {
    current.value = u;
    modalOpen.value = true;
}
async function fetchList(url) {
    loading.value = true;
    try {
        const query = {
            page: page.value,
            page_size: pageSize,
            ordering: ordering.value,
        };
        if (search.value)
            query.search = search.value;
        const q = buildQuery(query);
        const { data } = await api.get(url ?? (endpoints.units.list + q));
        rows.value = data.results;
        count.value = data.count;
    }
    catch (e) {
        ui.toast({ type: 'error', text: 'Ошибка загрузки единиц измерения' });
        console.error('Error fetching units:', e);
    }
    finally {
        loading.value = false;
    }
}
async function reload(p = page.value) {
    page.value = p;
    await fetchList();
}
async function remove(u) {
    if (!confirm(`Удалить единицу измерения "${u.name}"?`))
        return;
    deletingId.value = u.id;
    try {
        await api.delete(endpoints.units.one(u.id));
        ui.toast({ type: 'success', text: `Единица измерения "${u.name}" удалена` });
        await fetchList();
    }
    catch (e) {
        ui.toast({ type: 'error', text: 'Ошибка удаления единицы измерения' });
        console.error('Error deleting unit:', e);
    }
    finally {
        deletingId.value = null;
    }
}
async function onSaved() {
    modalOpen.value = false;
    ui.toast({ type: 'success', text: 'Единица измерения сохранена' });
    await fetchList();
}
onMounted(() => fetchList());
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
if (__VLS_ctx.canEdit) {
    // @ts-ignore
    [canEdit,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.openCreate) },
        ...{ class: "btn btn-primary" },
    });
    // @ts-ignore
    [openCreate,];
    __VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
        ...{ class: "w-4 h-4 mr-2" },
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
    });
    __VLS_asFunctionalElement(__VLS_elements.path, __VLS_elements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M12 4v16m8-8H4",
    });
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex gap-2 items-end" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "grid" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-xs text-base-content-600" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onKeyup: (...[$event]) => {
            __VLS_ctx.reload(1);
            // @ts-ignore
            [reload,];
        } },
    ...{ class: "input input-bordered input-sm" },
    placeholder: "название / код",
});
(__VLS_ctx.search);
// @ts-ignore
[search,];
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "grid" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-xs text-base-content-600" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.ordering),
    ...{ class: "select select-bordered select-sm" },
});
// @ts-ignore
[ordering,];
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "name",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "-name",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "code",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "-code",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "id",
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: "-id",
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.reload(1);
            // @ts-ignore
            [reload,];
        } },
    ...{ class: "btn btn-outline btn-sm" },
});
__VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
    ...{ class: "w-4 h-4 mr-1" },
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
});
__VLS_asFunctionalElement(__VLS_elements.path, __VLS_elements.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "overflow-auto border border-base-200 rounded-xl" },
});
__VLS_asFunctionalElement(__VLS_elements.table, __VLS_elements.table)({
    ...{ class: "table table-zebra w-full" },
});
__VLS_asFunctionalElement(__VLS_elements.thead, __VLS_elements.thead)({});
__VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-left" },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-left" },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-left" },
});
if (__VLS_ctx.canEdit) {
    // @ts-ignore
    [canEdit,];
    __VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
        ...{ class: "text-right" },
    });
}
__VLS_asFunctionalElement(__VLS_elements.tbody, __VLS_elements.tbody)({});
for (const [u] of __VLS_getVForSourceType((__VLS_ctx.rows))) {
    // @ts-ignore
    [rows,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        key: (u.id),
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    (u.id);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "font-medium" },
    });
    (u.name);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "text-sm text-base-content-600 font-mono" },
    });
    (u.code);
    if (__VLS_ctx.canEdit) {
        // @ts-ignore
        [canEdit,];
        __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
            ...{ class: "text-right" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "inline-flex gap-2" },
        });
        __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.canEdit))
                        return;
                    __VLS_ctx.openEdit(u);
                    // @ts-ignore
                    [openEdit,];
                } },
            ...{ class: "btn btn-xs btn-outline" },
        });
        __VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
            ...{ class: "w-3 h-3 mr-1" },
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
        });
        __VLS_asFunctionalElement(__VLS_elements.path, __VLS_elements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
        });
        __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.canEdit))
                        return;
                    __VLS_ctx.remove(u);
                    // @ts-ignore
                    [remove,];
                } },
            ...{ class: "btn btn-xs btn-error" },
            disabled: (__VLS_ctx.deletingId === u.id),
        });
        // @ts-ignore
        [deletingId,];
        if (__VLS_ctx.deletingId !== u.id) {
            // @ts-ignore
            [deletingId,];
            __VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
                ...{ class: "w-3 h-3 mr-1" },
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
            });
            __VLS_asFunctionalElement(__VLS_elements.path, __VLS_elements.path)({
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
                'stroke-width': "2",
                d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
            });
        }
        (__VLS_ctx.deletingId === u.id ? '...' : 'Удал.');
        // @ts-ignore
        [deletingId,];
    }
}
if (!__VLS_ctx.loading && __VLS_ctx.rows.length === 0) {
    // @ts-ignore
    [rows, loading,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        colspan: (__VLS_ctx.canEdit ? 4 : 3),
        ...{ class: "text-center text-base-content-500 py-8" },
    });
    // @ts-ignore
    [canEdit,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "flex flex-col items-center gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_elements.svg, __VLS_elements.svg)({
        ...{ class: "w-8 h-8 opacity-50" },
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
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex items-center justify-between" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "text-sm opacity-70" },
});
(__VLS_ctx.count);
// @ts-ignore
[count,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex items-center gap-2" },
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
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "text-sm" },
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
[count, page, pageSize,];
/** @type {[typeof Modal, typeof Modal, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(Modal, new Modal({
    modelValue: (__VLS_ctx.modalOpen),
    title: (''),
    size: "lg",
    closable: (true),
}));
const __VLS_1 = __VLS_0({
    modelValue: (__VLS_ctx.modalOpen),
    title: (''),
    size: "lg",
    closable: (true),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
const { default: __VLS_3 } = __VLS_2.slots;
// @ts-ignore
[modalOpen,];
/** @type {[typeof UnitForm, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(UnitForm, new UnitForm({
    ...{ 'onSaved': {} },
    ...{ 'onCancel': {} },
    initial: (__VLS_ctx.current),
}));
const __VLS_5 = __VLS_4({
    ...{ 'onSaved': {} },
    ...{ 'onCancel': {} },
    initial: (__VLS_ctx.current),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
let __VLS_7;
let __VLS_8;
const __VLS_9 = ({ saved: {} },
    { onSaved: (__VLS_ctx.onSaved) });
const __VLS_10 = ({ cancel: {} },
    { onCancel: (...[$event]) => {
            __VLS_ctx.modalOpen = false;
            // @ts-ignore
            [modalOpen, current, onSaved,];
        } });
var __VLS_6;
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-600']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-600']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-base-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table-zebra']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-600']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-error']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-500']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['join-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['join-item']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['join-item']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        UnitForm: UnitForm,
        Modal: Modal,
        canEdit: canEdit,
        rows: rows,
        count: count,
        page: page,
        pageSize: pageSize,
        search: search,
        ordering: ordering,
        loading: loading,
        modalOpen: modalOpen,
        current: current,
        deletingId: deletingId,
        openCreate: openCreate,
        openEdit: openEdit,
        reload: reload,
        remove: remove,
        onSaved: onSaved,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
