/**
 * Единые хелперы для статусов
 */

const statusLabelMap: Record<string, string> = {
  new: 'Новая',
  completed: 'Выполнено',
  cancelled: 'Отменена',
  active: 'Активный',
  inactive: 'Неактивный',
  admin: 'Администратор',
  manager: 'Управляющий',
  warehouse: 'Склад/Цех/Проект',
  brigadier: 'Бригадир/Инженер',
  requester: 'Заявитель',
  '': 'Роль не задана',
}

const statusClassMap: Record<string, string> = {
  new: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
  active: 'badge-success',
  inactive: 'badge-error',
  admin: 'badge-primary',
  manager: 'badge-secondary',
  warehouse: 'badge-accent',
  brigadier: 'badge-warning',
  requester: 'badge-info',
}

export function getStatusLabel(
  status: string | boolean | null | undefined,
  overrides: Record<string, string> = {}
): string {
  if (status === true) {
    return 'Активен'
  }
  if (status === false) {
    return 'Неактивен'
  }

  if (status === null || status === undefined) { return '—' }

  const normalized = String(status)
  return overrides[normalized] || statusLabelMap[normalized] || normalized
}

export function getStatusBadgeClass(
  status: string | boolean | null | undefined,
  overrides: Record<string, string> = {}
): string {
  if (status === true) {
    return 'badge-success'
  }
  if (status === false) {
    return 'badge-error'
  }

  if (status === null || status === undefined || status === '') { return 'badge-neutral' }
  const normalized = String(status)
  return overrides[normalized] || statusClassMap[normalized] || 'badge-neutral'
}
