import { ref } from 'vue';
import api from '@/api/client';
const file = ref(null);
const mapping = ref('');
const sheet = ref('');
const dryRun = ref(true);
const resp = ref(null);
const error = ref('');
function onFile(e) {
    const input = e.target;
    file.value = input.files?.[0] || null;
}
async function run() {
    error.value = '';
    resp.value = null;
    try {
        const fd = new FormData();
        if (!file.value)
            throw new Error('Не выбран файл');
        fd.append('file', file.value);
        if (mapping.value)
            fd.append('mapping', mapping.value);
        const url = `/purchases/import?dry_run=${dryRun.value ? '1' : '0'}${sheet.value ? `&sheet=${encodeURIComponent(sheet.value)}` : ''}`;
        const { data } = await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        resp.value = data;
    }
    catch (e) {
        error.value = e?.response?.data?.error || e.message || 'Ошибка импорта';
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "card p-5 space-y-4" },
});
__VLS_asFunctionalElement(__VLS_elements.h2, __VLS_elements.h2)({
    ...{ class: "text-lg font-semibold" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "grid md:grid-cols-2 gap-4" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ onChange: (__VLS_ctx.onFile) },
    type: "file",
    accept: ".xlsx",
});
// @ts-ignore
[onFile,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    ...{ class: "input" },
    placeholder: "например, Закупки",
});
(__VLS_ctx.sheet);
// @ts-ignore
[sheet,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "label" },
});
__VLS_asFunctionalElement(__VLS_elements.textarea, __VLS_elements.textarea)({
    ...{ class: "input h-32" },
    value: (__VLS_ctx.mapping),
    placeholder: '{"date":"Дата","supplier":"Поставщик","invoice":"Накладная","item":"Товар","qty":"Количество","price":"Цена","total":"Сумма"}',
});
// @ts-ignore
[mapping,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "flex items-center gap-3" },
});
__VLS_asFunctionalElement(__VLS_elements.label, __VLS_elements.label)({
    ...{ class: "inline-flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_elements.input)({
    type: "checkbox",
});
(__VLS_ctx.dryRun);
// @ts-ignore
[dryRun,];
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.run) },
    ...{ class: "btn" },
    disabled: (!__VLS_ctx.file),
});
// @ts-ignore
[run, file,];
if (__VLS_ctx.resp) {
    // @ts-ignore
    [resp,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "mt-4" },
    });
    __VLS_asFunctionalElement(__VLS_elements.h3, __VLS_elements.h3)({
        ...{ class: "font-semibold mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_elements.pre, __VLS_elements.pre)({
        ...{ class: "bg-base-200 rounded-xl p-3 text-sm overflow-auto" },
    });
    (__VLS_ctx.resp);
    // @ts-ignore
    [resp,];
}
if (__VLS_ctx.error) {
    // @ts-ignore
    [error,];
    __VLS_asFunctionalElement(__VLS_elements.p, __VLS_elements.p)({
        ...{ class: "text-sm text-error" },
    });
    (__VLS_ctx.error);
    // @ts-ignore
    [error,];
}
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['p-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['label']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['h-32']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-base-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-error']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup: () => ({
        file: file,
        mapping: mapping,
        sheet: sheet,
        dryRun: dryRun,
        resp: resp,
        error: error,
        onFile: onFile,
        run: run,
    }),
});
export default (await import('vue')).defineComponent({});
; /* PartiallyEnd: #4569/main.vue */
