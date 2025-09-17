import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import MaterialForm from './MaterialForm.vue';
import { useAuthStore } from '@/stores/auth';
import { useMaterialsStore } from '@/stores/materials';
import { useUiStore } from '@/stores/ui';
import Modal from '@/components/Modal.vue';
import Table from '@/components/Table.vue';
import FormField from '@/components/FormField.vue';
import Pagination from '@/components/Pagination.vue';
const router = useRouter();
const auth = useAuthStore();
const materialsStore = useMaterialsStore();
const ui = useUiStore();
// Computed
const canEdit = computed(() => {
    const role = auth.role;
    return role === 'admin' || role === 'director';
});
// Table configuration
const columns = [
    { key: 'id', title: 'ID', sortable: true, class: 'w-16' },
    { key: 'photo_url', title: 'Фото', sortable: false, class: 'w-20' },
    { key: 'name', title: 'Название', sortable: true },
    { key: 'sku', title: 'SKU', sortable: true, class: 'w-24' },
    { key: 'category_name', title: 'Категория', sortable: false },
    { key: 'default_unit_code', title: 'Ед.', sortable: false, class: 'w-16' },
    { key: 'is_active', title: 'Статус', sortable: false, class: 'w-24' }
];
const actions = computed(() => {
    if (!canEdit.value)
        return [];
    return [
        {
            key: 'edit',
            label: 'Изменить',
            class: 'btn-primary btn-xs'
        },
        {
            key: 'delete',
            label: 'Удалить',
            class: 'btn-error btn-xs',
            disabled: (row) => materialsStore.loading
        }
    ];
});
// Sorting
const sortBy = ref('');
const sortOrder = ref('asc');
// Ordering options
const orderingOptions = [
    { value: 'name', label: 'Название ↑' },
    { value: '-name', label: 'Название ↓' },
    { value: 'sku', label: 'SKU ↑' },
    { value: '-sku', label: 'SKU ↓' },
    { value: 'id', label: 'ID ↑' },
    { value: '-id', label: 'ID ↓' }
];
// Modal state
const modalOpen = ref(false);
const current = ref(null);
// Methods
function openCreate() {
    current.value = null;
    modalOpen.value = true;
}
function openEdit(material) {
    current.value = material;
    modalOpen.value = true;
}
async function handleSearch() {
    try {
        await materialsStore.fetchList({
            page: 1,
            search: materialsStore.filters.search,
            ordering: materialsStore.filters.ordering
        });
    }
    catch (error) {
        ui.toast({ type: 'error', text: 'Ошибка поиска материалов' });
    }
}
function handleSort(key) {
    if (sortBy.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    }
    else {
        sortBy.value = key;
        sortOrder.value = 'asc';
    }
    const ordering = sortOrder.value === 'desc' ? `-${key}` : key;
    materialsStore.setFilters({ ordering });
    handleSearch();
}
function handlePageChange(page) {
    materialsStore.fetchList({ page });
}
async function handleAction(action, row) {
    switch (action) {
        case 'edit':
            openEdit(row);
            break;
        case 'delete':
            await handleDelete(row);
            break;
    }
}
async function handleDelete(material) {
    if (!confirm(`Удалить материал "${material.name}"?`))
        return;
    try {
        await materialsStore.delete(material.id);
        ui.toast({ type: 'success', text: 'Материал удален' });
    }
    catch (error) {
        ui.toast({ type: 'error', text: 'Ошибка удаления материала' });
    }
}
async function onSaved() {
    modalOpen.value = false;
    current.value = null;
    await materialsStore.fetchList();
    ui.toast({ type: 'success', text: 'Материал сохранен' });
}
// Lifecycle
onMounted(async () => {
    try {
        await materialsStore.fetchList();
    }
    catch (error) {
        ui.toast({ type: 'error', text: 'Ошибка загрузки материалов' });
    }
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
if (__VLS_ctx.canEdit) {
    // @ts-ignore
    [canEdit,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.openCreate) },
        ...{ class: "btn btn-primary" },
        disabled: (__VLS_ctx.materialsStore.loading),
    });
    // @ts-ignore
    [openCreate, materialsStore,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex gap-2 items-end" },
});
/** @type {[typeof FormField, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(FormField, new FormField({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.materialsStore.filters.search),
    type: "input",
    placeholder: "Поиск по названию, SKU, категории",
    ...{ class: "flex-1" },
}));
const __VLS_1 = __VLS_0({
    ...{ 'onKeyup': {} },
    modelValue: (__VLS_ctx.materialsStore.filters.search),
    type: "input",
    placeholder: "Поиск по названию, SKU, категории",
    ...{ class: "flex-1" },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
const __VLS_5 = ({ keyup: {} },
    { onKeyup: (__VLS_ctx.handleSearch) });
// @ts-ignore
[materialsStore, handleSearch,];
var __VLS_2;
/** @type {[typeof FormField, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(FormField, new FormField({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.materialsStore.filters.ordering),
    type: "select",
    options: (__VLS_ctx.orderingOptions),
}));
const __VLS_8 = __VLS_7({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.materialsStore.filters.ordering),
    type: "select",
    options: (__VLS_ctx.orderingOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
let __VLS_10;
let __VLS_11;
const __VLS_12 = ({ change: {} },
    { onChange: (__VLS_ctx.handleSearch) });
// @ts-ignore
[materialsStore, handleSearch, orderingOptions,];
var __VLS_9;
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.handleSearch) },
    ...{ class: "btn btn-outline btn-sm" },
    disabled: (__VLS_ctx.materialsStore.loading),
});
// @ts-ignore
[materialsStore, handleSearch,];
if (__VLS_ctx.materialsStore.error) {
    // @ts-ignore
    [materialsStore,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "alert alert-error" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (__VLS_ctx.materialsStore.error);
    // @ts-ignore
    [materialsStore,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.materialsStore.error))
                    return;
                __VLS_ctx.materialsStore.clearError();
                // @ts-ignore
                [materialsStore,];
            } },
        ...{ class: "btn btn-sm btn-ghost" },
    });
}
/** @type {[typeof Table, typeof Table, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(Table, new Table({
    ...{ 'onSort': {} },
    ...{ 'onAction': {} },
    data: (__VLS_ctx.materialsStore.items),
    columns: (__VLS_ctx.columns),
    actions: (__VLS_ctx.actions),
    loading: (__VLS_ctx.materialsStore.loading),
    sortBy: (__VLS_ctx.sortBy),
    sortOrder: (__VLS_ctx.sortOrder),
}));
const __VLS_15 = __VLS_14({
    ...{ 'onSort': {} },
    ...{ 'onAction': {} },
    data: (__VLS_ctx.materialsStore.items),
    columns: (__VLS_ctx.columns),
    actions: (__VLS_ctx.actions),
    loading: (__VLS_ctx.materialsStore.loading),
    sortBy: (__VLS_ctx.sortBy),
    sortOrder: (__VLS_ctx.sortOrder),
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
let __VLS_17;
let __VLS_18;
const __VLS_19 = ({ sort: {} },
    { onSort: (__VLS_ctx.handleSort) });
const __VLS_20 = ({ action: {} },
    { onAction: (__VLS_ctx.handleAction) });
const { default: __VLS_21 } = __VLS_16.slots;
// @ts-ignore
[materialsStore, materialsStore, columns, actions, sortBy, sortOrder, handleSort, handleAction,];
{
    const { 'cell-photo_url': __VLS_22 } = __VLS_16.slots;
    const [{ value }] = __VLS_getSlotParameters(__VLS_22);
    if (value) {
        __VLS_asFunctionalElement(__VLS_elements.img)({
            src: (value),
            alt: "Фото материала",
            ...{ class: "h-10 w-10 object-cover rounded" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
            ...{ class: "opacity-60 text-sm" },
        });
    }
}
{
    const { 'cell-is_active': __VLS_23 } = __VLS_16.slots;
    const [{ value }] = __VLS_getSlotParameters(__VLS_23);
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "badge" },
        ...{ class: ((value ?? true) ? 'badge-success' : 'badge-ghost') },
    });
    ((value ?? true) ? 'Активен' : 'Выключен');
}
var __VLS_16;
/** @type {[typeof Pagination, ]} */ ;
// @ts-ignore
const __VLS_24 = __VLS_asFunctionalComponent(Pagination, new Pagination({
    ...{ 'onPageChange': {} },
    currentPage: (__VLS_ctx.materialsStore.pagination.page),
    totalPages: (Math.ceil(__VLS_ctx.materialsStore.pagination.count / __VLS_ctx.materialsStore.pagination.pageSize)),
}));
const __VLS_25 = __VLS_24({
    ...{ 'onPageChange': {} },
    currentPage: (__VLS_ctx.materialsStore.pagination.page),
    totalPages: (Math.ceil(__VLS_ctx.materialsStore.pagination.count / __VLS_ctx.materialsStore.pagination.pageSize)),
}, ...__VLS_functionalComponentArgsRest(__VLS_24));
let __VLS_27;
let __VLS_28;
const __VLS_29 = ({ pageChange: {} },
    { onPageChange: (__VLS_ctx.handlePageChange) });
// @ts-ignore
[materialsStore, materialsStore, materialsStore, handlePageChange,];
var __VLS_26;
/** @type {[typeof Modal, typeof Modal, ]} */ ;
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent(Modal, new Modal({
    modelValue: (__VLS_ctx.modalOpen),
    title: (__VLS_ctx.current ? 'Редактировать материал' : 'Новый материал'),
}));
const __VLS_32 = __VLS_31({
    modelValue: (__VLS_ctx.modalOpen),
    title: (__VLS_ctx.current ? 'Редактировать материал' : 'Новый материал'),
}, ...__VLS_functionalComponentArgsRest(__VLS_31));
const { default: __VLS_34 } = __VLS_33.slots;
// @ts-ignore
[modalOpen, current,];
/** @type {[typeof MaterialForm, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(MaterialForm, new MaterialForm({
    ...{ 'onSaved': {} },
    ...{ 'onCancel': {} },
    initial: (__VLS_ctx.current),
}));
const __VLS_36 = __VLS_35({
    ...{ 'onSaved': {} },
    ...{ 'onCancel': {} },
    initial: (__VLS_ctx.current),
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
let __VLS_38;
let __VLS_39;
const __VLS_40 = ({ saved: {} },
    { onSaved: (__VLS_ctx.onSaved) });
const __VLS_41 = ({ cancel: {} },
    { onCancel: (...[$event]) => {
            __VLS_ctx.modalOpen = false;
            // @ts-ignore
            [modalOpen, current, onSaved,];
        } });
var __VLS_37;
var __VLS_33;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['items-end']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['alert']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-error']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-60']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        MaterialForm: MaterialForm,
        Modal: Modal,
        Table: Table,
        FormField: FormField,
        Pagination: Pagination,
        materialsStore: materialsStore,
        canEdit: canEdit,
        columns: columns,
        actions: actions,
        sortBy: sortBy,
        sortOrder: sortOrder,
        orderingOptions: orderingOptions,
        modalOpen: modalOpen,
        current: current,
        openCreate: openCreate,
        handleSearch: handleSearch,
        handleSort: handleSort,
        handlePageChange: handlePageChange,
        handleAction: handleAction,
        onSaved: onSaved,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
