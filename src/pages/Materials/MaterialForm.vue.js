import { onMounted, reactive, ref, watchEffect, computed } from 'vue';
import FileInput from '@/components/FileInput.vue';
import FormField from '@/components/FormField.vue';
import { useUiStore } from '@/stores/ui';
import { useMaterialsStore } from '@/stores/materials';
import { useUnitsStore } from '@/stores/units';
const props = defineProps();
const emit = defineEmits();
const ui = useUiStore();
const materialsStore = useMaterialsStore();
const unitsStore = useUnitsStore();
// Form data
const form = reactive({
    name: '',
    sku: '',
    category: '',
    default_unit: '',
});
const errors = reactive({
    name: null,
    sku: null,
    category: null,
    default_unit: null,
    photo: null,
});
const submitting = ref(false);
const photoFile = ref(null);
const currentPhotoUrl = ref(null);
const deletingPhoto = ref(false);
// Computed options for selects
const unitOptions = computed(() => {
    return unitsStore.selectOptions;
});
const categoryOptions = computed(() => {
    // TODO: Implement material categories store
    return [
        { value: '', label: '— без категории —' }
    ];
});
// Load data on mount
onMounted(async () => {
    try {
        await unitsStore.fetchList();
        // TODO: Load categories when store is implemented
    }
    catch (error) {
        ui.toast({ type: 'error', text: 'Ошибка загрузки справочников' });
    }
});
// Watch for initial data changes
watchEffect(() => {
    if (props.initial) {
        form.name = props.initial.name || '';
        form.sku = props.initial.sku || '';
        form.category = props.initial.category ? String(props.initial.category) : '';
        form.default_unit = props.initial.default_unit ? String(props.initial.default_unit) : '';
        currentPhotoUrl.value = props.initial.photo_url || null;
    }
    else {
        form.name = '';
        form.sku = '';
        form.category = '';
        form.default_unit = '';
        currentPhotoUrl.value = null;
    }
    photoFile.value = null;
    // Clear errors
    for (const k of Object.keys(errors))
        errors[k] = null;
});
// Helper function to extract errors from API response
function pickError(payload, key) {
    const v = payload?.[key];
    if (Array.isArray(v) && v.length)
        return String(v[0]);
    if (typeof v === 'string')
        return v;
    const nested = payload?.errors?.[key];
    if (Array.isArray(nested) && nested.length)
        return String(nested[0]);
    if (typeof nested === 'string')
        return nested;
    return null;
}
// Upload photo using store
async function uploadPhoto(materialId) {
    if (!photoFile.value)
        return;
    try {
        await materialsStore.uploadPhoto(materialId, photoFile.value);
        currentPhotoUrl.value = materialsStore.current?.photo_url || null;
        photoFile.value = null;
        ui.toast({ type: 'success', text: 'Фото загружено' });
    }
    catch (e) {
        const d = e?.response?.data || {};
        errors.photo = pickError(d, 'photo') || d?.detail || 'Ошибка загрузки фото';
        throw e;
    }
}
// Delete photo
async function onDeletePhoto() {
    if (!props.initial?.id && !currentPhotoUrl.value)
        return;
    if (!confirm('Удалить фото материала?'))
        return;
    deletingPhoto.value = true;
    try {
        const id = props.initial?.id;
        if (!id) {
            photoFile.value = null;
            currentPhotoUrl.value = null;
            return;
        }
        // TODO: Implement delete photo in materials store
        // await materialsStore.deletePhoto(id)
        currentPhotoUrl.value = null;
        ui.toast({ type: 'success', text: 'Фото удалено' });
    }
    catch (e) {
        const d = e?.response?.data || {};
        errors.photo = d?.detail || 'Не удалось удалить фото';
    }
    finally {
        deletingPhoto.value = false;
    }
}
// Client-side validation
function clientValidate() {
    let ok = true;
    errors.name = null;
    errors.default_unit = null;
    if (!form.name.trim()) {
        errors.name = 'Заполните название';
        ok = false;
    }
    if (!form.default_unit) {
        errors.default_unit = 'Выберите единицу';
        ok = false;
    }
    return ok;
}
// Submit form
async function submit() {
    // Clear previous errors
    for (const k of Object.keys(errors))
        errors[k] = null;
    // Client validation
    if (!clientValidate())
        return;
    submitting.value = true;
    try {
        const formData = {
            name: form.name,
            sku: form.sku || undefined,
            category: form.category ? Number(form.category) : undefined,
            default_unit: Number(form.default_unit)
        };
        let materialId;
        if (props.initial?.id) {
            // Update existing material
            await materialsStore.update(props.initial.id, formData);
            materialId = props.initial.id;
        }
        else {
            // Create new material
            const newMaterial = await materialsStore.create(formData);
            materialId = newMaterial.id;
        }
        // Upload photo if selected
        if (photoFile.value) {
            await uploadPhoto(materialId);
        }
        emit('saved');
    }
    catch (e) {
        const d = e?.response?.data || {};
        // Extract field errors
        errors.name = pickError(d, 'name');
        errors.sku = pickError(d, 'sku');
        errors.category = pickError(d, 'category');
        errors.default_unit = pickError(d, 'default_unit');
        // If no specific field errors, show general error
        if (!errors.name && !errors.default_unit && d?.detail && typeof d.detail === 'string') {
            errors.name = d.detail;
        }
    }
    finally {
        submitting.value = false;
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_elements.form, __VLS_elements.form)({
    ...{ onSubmit: (__VLS_ctx.submit) },
    ...{ class: "grid gap-4" },
});
// @ts-ignore
[submit,];
/** @type {[typeof FormField, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(FormField, new FormField({
    modelValue: (__VLS_ctx.form.name),
    type: "input",
    label: "Название материала",
    placeholder: "Введите название материала",
    required: true,
    errorMessage: (__VLS_ctx.errors.name),
    hasError: (!!__VLS_ctx.errors.name),
}));
const __VLS_1 = __VLS_0({
    modelValue: (__VLS_ctx.form.name),
    type: "input",
    label: "Название материала",
    placeholder: "Введите название материала",
    required: true,
    errorMessage: (__VLS_ctx.errors.name),
    hasError: (!!__VLS_ctx.errors.name),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
// @ts-ignore
[form, errors, errors,];
/** @type {[typeof FormField, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(FormField, new FormField({
    modelValue: (__VLS_ctx.form.sku),
    type: "input",
    label: "SKU",
    placeholder: "Артикул/код",
    helpText: "Необязательно",
    errorMessage: (__VLS_ctx.errors.sku),
    hasError: (!!__VLS_ctx.errors.sku),
}));
const __VLS_5 = __VLS_4({
    modelValue: (__VLS_ctx.form.sku),
    type: "input",
    label: "SKU",
    placeholder: "Артикул/код",
    helpText: "Необязательно",
    errorMessage: (__VLS_ctx.errors.sku),
    hasError: (!!__VLS_ctx.errors.sku),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
// @ts-ignore
[form, errors, errors,];
/** @type {[typeof FormField, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(FormField, new FormField({
    modelValue: (__VLS_ctx.form.category),
    type: "select",
    label: "Категория",
    placeholder: "— без категории —",
    options: (__VLS_ctx.categoryOptions),
    errorMessage: (__VLS_ctx.errors.category),
    hasError: (!!__VLS_ctx.errors.category),
}));
const __VLS_9 = __VLS_8({
    modelValue: (__VLS_ctx.form.category),
    type: "select",
    label: "Категория",
    placeholder: "— без категории —",
    options: (__VLS_ctx.categoryOptions),
    errorMessage: (__VLS_ctx.errors.category),
    hasError: (!!__VLS_ctx.errors.category),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
// @ts-ignore
[form, errors, errors, categoryOptions,];
/** @type {[typeof FormField, ]} */ ;
// @ts-ignore
const __VLS_12 = __VLS_asFunctionalComponent(FormField, new FormField({
    modelValue: (__VLS_ctx.form.default_unit),
    type: "select",
    label: "Единица по умолчанию",
    placeholder: "— выберите единицу —",
    options: (__VLS_ctx.unitOptions),
    required: true,
    errorMessage: (__VLS_ctx.errors.default_unit),
    hasError: (!!__VLS_ctx.errors.default_unit),
}));
const __VLS_13 = __VLS_12({
    modelValue: (__VLS_ctx.form.default_unit),
    type: "select",
    label: "Единица по умолчанию",
    placeholder: "— выберите единицу —",
    options: (__VLS_ctx.unitOptions),
    required: true,
    errorMessage: (__VLS_ctx.errors.default_unit),
    hasError: (!!__VLS_ctx.errors.default_unit),
}, ...__VLS_functionalComponentArgsRest(__VLS_12));
// @ts-ignore
[form, errors, errors, unitOptions,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "form-control" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text" },
});
/** @type {[typeof FileInput, ]} */ ;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent(FileInput, new FileInput({
    modelValue: (__VLS_ctx.photoFile),
    accept: "image/*",
    maxSizeMb: (8),
    existingUrl: (__VLS_ctx.currentPhotoUrl),
}));
const __VLS_17 = __VLS_16({
    modelValue: (__VLS_ctx.photoFile),
    accept: "image/*",
    maxSizeMb: (8),
    existingUrl: (__VLS_ctx.currentPhotoUrl),
}, ...__VLS_functionalComponentArgsRest(__VLS_16));
// @ts-ignore
[photoFile, currentPhotoUrl,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex gap-2 mt-2" },
});
if (__VLS_ctx.currentPhotoUrl) {
    // @ts-ignore
    [currentPhotoUrl,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.onDeletePhoto) },
        type: "button",
        ...{ class: "btn btn-ghost btn-sm" },
        disabled: (__VLS_ctx.deletingPhoto),
    });
    // @ts-ignore
    [onDeletePhoto, deletingPhoto,];
    (__VLS_ctx.deletingPhoto ? 'Удаление…' : 'Удалить фото');
    // @ts-ignore
    [deletingPhoto,];
}
if (__VLS_ctx.errors.photo) {
    // @ts-ignore
    [errors,];
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
        ...{ class: "text-xs text-error" },
    });
    (__VLS_ctx.errors.photo);
    // @ts-ignore
    [errors,];
}
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({
    ...{ class: "label-text-alt" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex justify-end gap-2 mt-6" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('cancel');
            // @ts-ignore
            [$emit,];
        } },
    type: "button",
    ...{ class: "btn btn-ghost" },
    disabled: (__VLS_ctx.submitting),
});
// @ts-ignore
[submitting,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    type: "submit",
    ...{ class: "btn btn-primary" },
    disabled: (__VLS_ctx.submitting),
});
// @ts-ignore
[submitting,];
(__VLS_ctx.submitting ? 'Сохранение…' : 'Сохранить');
// @ts-ignore
[submitting,];
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['form-control']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label-text-alt']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        FileInput: FileInput,
        FormField: FormField,
        form: form,
        errors: errors,
        submitting: submitting,
        photoFile: photoFile,
        currentPhotoUrl: currentPhotoUrl,
        deletingPhoto: deletingPhoto,
        unitOptions: unitOptions,
        categoryOptions: categoryOptions,
        onDeletePhoto: onDeletePhoto,
        submit: submit,
    }),
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
