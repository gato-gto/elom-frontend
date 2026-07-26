// F-584: единая система иконок для действий (edit/delete/view/...). Раньше жила только в
// GenericList (desktop-таблица). Вынесена сюда, чтобы мобильные карточки (MobileCard) рисовали
// ТЕ ЖЕ иконочные чипы, что и десктоп — иконки на мобиле «как в десктоп» (задача владельца).

export interface ActionLike {
  key: string
  label?: string
  // Явные переопределения на уровне конфига действия имеют приоритет над картой ниже.
  iconPath?: string
  btnClass?: string
}

// Heroicons-outline paths, keyed by action.key. Нестандартный action без иконки → рисуется текстом.
export const ACTION_ICONS: Record<string, string> = {
  edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  delete: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  view: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  open: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  // Одобрить = галочка, Отклонить = крестик (F-569)
  approve: 'M5 13l4 4L19 7',
  reject: 'M6 18L18 6M6 6l12 12',
  issue: 'M13 7l5 5m0 0l-5 5m5-5H6',
  return: 'M11 17l-5-5m0 0l5-5m-5 5h12',
}

// btn-soft (DaisyUI v5): мягкий семантический фон + насыщенная иконка того же тона (без обводки,
// фон контрастирует с иконкой). delete/reject=error, approve=success, issue=warning,
// edit/return=info, view/open=нейтральный.
export const ACTION_BTN: Record<string, string> = {
  delete: 'btn-soft btn-error',
  reject: 'btn-soft btn-error',
  approve: 'btn-soft btn-success',
  issue: 'btn-soft btn-warning',
  return: 'btn-soft btn-info',
  edit: 'btn-soft btn-info',
  view: 'btn-soft',
  open: 'btn-soft',
}

export function actionIconPath(action: ActionLike): string {
  return action.iconPath || ACTION_ICONS[action.key] || ''
}

export function actionBtnClass(action: ActionLike): string {
  return action.btnClass || ACTION_BTN[action.key] || 'btn-soft'
}
