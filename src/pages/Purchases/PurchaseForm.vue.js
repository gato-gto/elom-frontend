import { onMounted, reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api/client';
import endpoints, { buildQuery } from '@/api/endpoints';
const route = useRoute();
const router = useRouter();
const idParam = route.params.id ? Number(route.params.id) : null;
const isEdit = !!idParam;
const saving = ref(false);
const formError = ref(null);
const model = reactive({
    date: new Date().toISOString().slice(0, 10),
    object: undefined,
    supplier: '',
    invoice_number: '',
    vat_included: undefined,
    comment: '',
    responsible: undefined,
});
const items = ref([]);
const objects = ref([]);
const employees = ref([]);
const materials = ref([]);
const units = ref([]);
function addItem() {
    items.value.push({ _k: Date.now() + Math.random(), material: undefined, unit: undefined, quantity: '0', price: '0', amount: '0' });
}
function removeItem(idx) {
    items.value.splice(idx, 1);
}
function duplicateItem(idx) {
    const src = items.value[idx];
    items.value.splice(idx + 1, 0, { ...src, _k: Date.now() + Math.random() });
}
function recalc(it) {
    const q = Number(it.quantity || '0');
    const p = Number(it.price || '0');
    const a = (isFinite(q) ? q : 0) * (isFinite(p) ? p : 0);
    it.amount = a.toFixed(2);
}
function onMaterialChange(it) {
    // дефолтная единица = unit материала (если есть и если в позиции пусто)
    const m = materials.value.find(x => x.id === it.material);
    if (m && !it.unit)
        it.unit = m.default_unit;
}
function toObjectUrl(f) {
    return URL.createObjectURL(f);
}
const newPhotos = ref([]);
function onPhotos(e) {
    const input = e.target;
    if (input?.files?.length)
        newPhotos.value = Array.from(input.files);
}
const totalAmount = computed(() => {
    const sum = items.value.reduce((acc, it) => acc + Number(it.amount || '0'), 0);
    return sum.toFixed(2);
});
async function loadRefs() {
    const [od, ed, md, ud] = await Promise.all([
        api.get(endpoints.objects.list + buildQuery({ page_size: 1000, ordering: 'name' })),
        api.get(endpoints.employees.list + buildQuery({ page_size: 1000, ordering: 'username' })),
        api.get(endpoints.materials.list + buildQuery({ page_size: 1000, ordering: 'name' })),
        api.get(endpoints.units.list + buildQuery({ page_size: 1000, ordering: 'code' })),
    ]);
    objects.value = od.data.results;
    employees.value = ed.data.results;
    materials.value = md.data.results;
    units.value = ud.data.results;
}
async function loadIfEdit() {
    if (!isEdit)
        return;
    const { data } = await api.get(endpoints.purchases.one(idParam));
    // шапка
    model.date = data.date;
    model.object = data.object;
    model.supplier = data.supplier ?? '';
    model.invoice_number = data.invoice_number ?? '';
    model.vat_included = data.vat_included;
    model.comment = data.comment ?? '';
    model.responsible = data.responsible ?? undefined;
    // позиции → строки
    items.value = (data.items ?? []).map((x) => ({
        _k: Date.now() + Math.random(),
        material: x.material,
        unit: x.unit,
        quantity: String(x.quantity ?? 0),
        price: String(x.price ?? 0),
        amount: String(x.amount ?? (Number(x.quantity ?? 0) * Number(x.price ?? 0))),
    }));
}
async function onSubmit() {
    formError.value = null;
    if (!model.date || !model.object) {
        formError.value = 'Заполните дату и объект';
        return;
    }
    if (items.value.length === 0) {
        formError.value = 'Добавьте хотя бы одну позицию';
        return;
    }
    saving.value = true;
    try {
        // Готовим DTO для серверной модели
        const payloadItems = items.value.map(it => ({
            material: it.material,
            unit: it.unit,
            quantity: String(Number(it.quantity || 0)),
            price: it.price !== '' ? String(Number(it.price)) : undefined,
        }));
        let id = idParam;
        if (isEdit) {
            const payload = {
                date: model.date,
                object: model.object,
                supplier: model.supplier || undefined,
                invoice_number: model.invoice_number || undefined,
                vat_included: model.vat_included,
                comment: model.comment || undefined,
                responsible: model.responsible ?? undefined,
                items: payloadItems,
            };
            const { data } = await api.patch(endpoints.purchases.one(idParam), payload);
            id = data.id;
        }
        else {
            const payload = {
                date: model.date,
                object: model.object,
                supplier: model.supplier || '',
                invoice_number: model.invoice_number || undefined,
                vat_included: model.vat_included,
                comment: model.comment || undefined,
                responsible: model.responsible,
                items: payloadItems,
            };
            const { data } = await api.post(endpoints.purchases.list, payload);
            id = data.id;
        }
        // Фото после сохранения
        if (newPhotos.value.length && id) {
            const fd = new FormData();
            newPhotos.value.forEach(f => fd.append('photos[]', f));
            await api.post(endpoints.purchases.uploadPhoto(id), fd);
        }
        await router.replace(`/purchases/${id}`);
    }
    catch (e) {
        formError.value = e?.response?.data?.detail || 'Ошибка сохранения';
    }
    finally {
        saving.value = false;
    }
}
onMounted(async () => {
    await loadRefs();
    await loadIfEdit();
    if (!isEdit && items.value.length === 0)
        addItem();
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
(__VLS_ctx.isEdit ? 'Редактировать закупку' : 'Новая закупка');
// @ts-ignore
[isEdit,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex gap-2" },
});
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
// @ts-ignore
RouterLink;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "btn btn-ghost" },
    to: "/purchases",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "btn btn-ghost" },
    to: "/purchases",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
const { default: __VLS_4 } = __VLS_3.slots;
var __VLS_3;
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.onSubmit) },
    ...{ class: "btn btn-primary" },
    disabled: (__VLS_ctx.saving),
});
// @ts-ignore
[onSubmit, saving,];
(__VLS_ctx.saving ? 'Сохранение…' : 'Сохранить');
// @ts-ignore
[saving,];
if (__VLS_ctx.formError) {
    // @ts-ignore
    [formError,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "alert alert-error" },
    });
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (__VLS_ctx.formError);
    // @ts-ignore
    [formError,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card bg-base-100 border" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body grid md:grid-cols-4 gap-4" },
});
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "date",
    ...{ class: "input input-bordered" },
    required: true,
});
(__VLS_ctx.model.date);
// @ts-ignore
[model,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.model.object),
    ...{ class: "select select-bordered" },
    required: true,
});
// @ts-ignore
[model,];
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
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.model.responsible),
    ...{ class: "select select-bordered" },
});
// @ts-ignore
[model,];
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
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ class: "input input-bordered" },
    placeholder: "ИП Иванов",
});
(__VLS_ctx.model.supplier);
// @ts-ignore
[model,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ class: "input input-bordered" },
    placeholder: "A-12345",
});
(__VLS_ctx.model.invoice_number);
// @ts-ignore
[model,];
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
    value: (__VLS_ctx.model.vat_included),
    ...{ class: "select select-bordered" },
});
// @ts-ignore
[model,];
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: (undefined),
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: (true),
});
__VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
    value: (false),
});
__VLS_asFunctionalElement(__VLS_elements.fieldset, __VLS_elements.fieldset)({
    ...{ class: "fieldset w-100 md:col-span-2" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
__VLS_asFunctionalElement(__VLS_elements.textarea)({
    value: (__VLS_ctx.model.comment),
    ...{ class: "textarea input" },
    rows: "1",
});
// @ts-ignore
[model,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card bg-base-100 border" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex items-center justify-between mb-2" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({
    ...{ class: "card-title text-lg" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.addItem) },
    ...{ class: "btn btn-sm" },
});
// @ts-ignore
[addItem,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "overflow-auto" },
});
__VLS_asFunctionalElement(__VLS_elements.table, __VLS_elements.table)({
    ...{ class: "table w-full" },
});
__VLS_asFunctionalElement(__VLS_elements.thead, __VLS_elements.thead)({});
__VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_elements.tbody, __VLS_elements.tbody)({});
for (const [it, idx] of __VLS_getVForSourceType((__VLS_ctx.items))) {
    // @ts-ignore
    [items,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({
        key: (it._k),
    });
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    __VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.onMaterialChange(it);
                // @ts-ignore
                [onMaterialChange,];
            } },
        value: (it.material),
        ...{ class: "select select-bordered select-sm w-full" },
    });
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        value: (undefined),
        disabled: true,
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.materials))) {
        // @ts-ignore
        [materials,];
        __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
            key: (m.id),
            value: (m.id),
        });
        (m.name);
    }
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    __VLS_asFunctionalElement(__VLS_elements.select, __VLS_elements.select)({
        value: (it.unit),
        ...{ class: "select select-bordered select-sm w-full" },
    });
    __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
        value: (undefined),
    });
    for (const [u] of __VLS_getVForSourceType((__VLS_ctx.units))) {
        // @ts-ignore
        [units,];
        __VLS_asFunctionalElement(__VLS_elements.option, __VLS_elements.option)({
            key: (u.id),
            value: (u.id),
        });
        (u.code ?? u.id);
        (u.name);
    }
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    __VLS_asFunctionalElement(__VLS_elements.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.recalc(it);
                // @ts-ignore
                [recalc,];
            } },
        type: "number",
        step: "0.001",
        min: "0",
        ...{ class: "input input-bordered input-sm w-full" },
    });
    (it.quantity);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({});
    __VLS_asFunctionalElement(__VLS_elements.input)({
        ...{ onInput: (...[$event]) => {
                __VLS_ctx.recalc(it);
                // @ts-ignore
                [recalc,];
            } },
        type: "number",
        step: "0.01",
        min: "0",
        ...{ class: "input input-bordered input-sm w-full" },
    });
    (it.price);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "text-right" },
    });
    (it.amount);
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        ...{ class: "text-right" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.duplicateItem(idx);
                // @ts-ignore
                [duplicateItem,];
            } },
        ...{ class: "btn btn-xs btn-ghost" },
    });
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeItem(idx);
                // @ts-ignore
                [removeItem,];
            } },
        ...{ class: "btn btn-xs btn-error" },
    });
}
if (__VLS_ctx.items.length === 0) {
    // @ts-ignore
    [items,];
    __VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
    __VLS_asFunctionalElement(__VLS_elements.td, __VLS_elements.td)({
        colspan: "6",
        ...{ class: "text-center text-base-content-60" },
    });
}
__VLS_asFunctionalElement(__VLS_elements.tfoot, __VLS_elements.tfoot)({});
__VLS_asFunctionalElement(__VLS_elements.tr, __VLS_elements.tr)({});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    colspan: "4",
    ...{ class: "text-right" },
});
__VLS_asFunctionalElement(__VLS_elements.th, __VLS_elements.th)({
    ...{ class: "text-right" },
});
(__VLS_ctx.totalAmount);
// @ts-ignore
[totalAmount,];
__VLS_asFunctionalElement(__VLS_elements.th)({});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card bg-base-100 border" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card-body" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({
    ...{ class: "card-title text-lg" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onChange: (__VLS_ctx.onPhotos) },
    type: "file",
    ...{ class: "file-input file-input-bordered w-full max-w-md" },
    multiple: true,
});
// @ts-ignore
[onPhotos,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "mt-3 flex flex-wrap gap-2" },
});
for (const [f, i] of __VLS_getVForSourceType((__VLS_ctx.newPhotos))) {
    // @ts-ignore
    [newPhotos,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        key: (i),
        ...{ class: "avatar" },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "w-16 rounded" },
    });
    __VLS_asFunctionalElement(__VLS_elements.img)({
        src: (__VLS_ctx.toObjectUrl(f)),
    });
    // @ts-ignore
    [toObjectUrl,];
}
__VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
    ...{ class: "text-xs text-base-content-60 mt-2" },
});
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['alert']} */ ;
/** @type {__VLS_StyleScopedClasses['alert-error']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['fieldset']} */ ;
/** @type {__VLS_StyleScopedClasses['w-100']} */ ;
/** @type {__VLS_StyleScopedClasses['md:col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['select']} */ ;
/** @type {__VLS_StyleScopedClasses['select-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['select-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['input-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-error']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-60']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-right']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['card-body']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input']} */ ;
/** @type {__VLS_StyleScopedClasses['file-input-bordered']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-base-content-60']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        isEdit: isEdit,
        saving: saving,
        formError: formError,
        model: model,
        items: items,
        objects: objects,
        employees: employees,
        materials: materials,
        units: units,
        addItem: addItem,
        removeItem: removeItem,
        duplicateItem: duplicateItem,
        recalc: recalc,
        onMaterialChange: onMaterialChange,
        toObjectUrl: toObjectUrl,
        newPhotos: newPhotos,
        onPhotos: onPhotos,
        totalAmount: totalAmount,
        onSubmit: onSubmit,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
