/**
 * F-757 (A): решение о ненавязчивом напоминании «Закупка завершена без фото-отчёта».
 *
 * Фото-отчёт при завершении ОПЦИОНАЛЕН (D-019/F-271/F-302) — завершение не блокируется, но если
 * закупку завершают без фото-доказательства, показываем info-тост (в списке она несёт янтарный
 * маркер «нет фото-отчёта»).
 *
 * БАГ (владелец, 2026-08-07): тост вылетал на КАЖДОЕ сохранение уже-завершённой закупки, даже когда
 * у неё УЖЕ есть фото-отчёт на сервере — потому что прежнее условие смотрело лишь на НОВОПРИЛОЖЕННЫЕ
 * в форме фото (`reportPhotos.length === 0`) и на ТЕКУЩИЙ статус, а не на факт ПЕРЕХОДА в «Завершено».
 *
 * Правило: напоминаем ТОЛЬКО когда закупку ИМЕННО СЕЙЧАС переводят в «Завершено» (был не-completed →
 * стал completed) И у неё нет фото-отчёта ни на сервере, ни приложенного в этой форме.
 */
export function shouldWarnCompletedWithoutReport(args: {
  isEdit: boolean
  wasCompleted: boolean
  newStatus: string
  stagedReportPhotos: number
  hasServerReportPhotos: boolean
}): boolean {
  const { isEdit, wasCompleted, newStatus, stagedReportPhotos, hasServerReportPhotos } = args
  const transitioningToCompleted = !wasCompleted && newStatus === 'completed'
  const hasNoReportEvidence = stagedReportPhotos === 0 && !hasServerReportPhotos
  return isEdit && transitioningToCompleted && hasNoReportEvidence
}
