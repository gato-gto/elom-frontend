import { describe, it, expect } from 'vitest'
import { shouldWarnCompletedWithoutReport as warn } from '../completionWarning'

const base = {
  isEdit: true,
  wasCompleted: false,
  newStatus: 'completed',
  stagedReportPhotos: 0,
  hasServerReportPhotos: false,
}

describe('shouldWarnCompletedWithoutReport', () => {
  // ---- сам баг владельца (2026-08-07): уже-завершённая закупка С фото на сервере ----
  it('НЕ предупреждает при сохранении уже-завершённой закупки, у которой есть фото-отчёт на сервере', () => {
    // покупка 12312321: status=completed, has_report_photos=true, новых фото в форме нет
    expect(warn({ ...base, wasCompleted: true, hasServerReportPhotos: true })).toBe(false)
  })

  it('НЕ предупреждает при сохранении уже-завершённой закупки даже без фото (не перевод, а повторное сохранение)', () => {
    expect(warn({ ...base, wasCompleted: true, hasServerReportPhotos: false, stagedReportPhotos: 0 })).toBe(false)
  })

  // ---- ради чего тост существует: переход в «Завершено» без единого фото ----
  it('предупреждает при переводе new→completed без фото-отчёта (ни на сервере, ни в форме)', () => {
    expect(warn(base)).toBe(true)
  })

  // ---- границы каждой ветки ----
  it('НЕ предупреждает при переводе в completed, если приложены новые фото в форме', () => {
    expect(warn({ ...base, stagedReportPhotos: 2 })).toBe(false)
  })

  it('НЕ предупреждает при переводе в completed, если фото уже есть на сервере', () => {
    expect(warn({ ...base, hasServerReportPhotos: true })).toBe(false)
  })

  it('НЕ предупреждает, если новый статус не completed', () => {
    expect(warn({ ...base, newStatus: 'new' })).toBe(false)
  })

  it('НЕ предупреждает при создании (isEdit=false), даже если сразу completed без фото', () => {
    expect(warn({ ...base, isEdit: false })).toBe(false)
  })
})
