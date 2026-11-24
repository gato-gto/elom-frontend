import { describe, it, expect, afterEach } from 'vitest'
import { formatDate, formatDateWithOptions, formatMonthYear } from '../formatters'

// Аудит F-20 ②: new Date('2026-11-24') — это полночь UTC; на устройстве западнее UTC (поездка, браузер
// в другом поясе) дата показывалась на день раньше. Календарная дата 'YYYY-MM-DD' — без пояса.
const ORIGINAL_TZ = process.env.TZ
afterEach(() => { process.env.TZ = ORIGINAL_TZ })

describe('formatDate — календарная дата не сдвигается поясом', () => {
  it('test_date_only_string_west_of_utc_keeps_same_day', () => {
    process.env.TZ = 'America/New_York'
    expect(formatDate('2026-11-24')).toBe('24.11.2026')
  })

  it('test_date_only_string_east_of_utc_keeps_same_day', () => {
    process.env.TZ = 'Asia/Tashkent'
    expect(formatDate('2026-01-01')).toBe('01.01.2026')
  })

  it('test_month_name_of_first_day_west_of_utc_is_that_month', () => {
    process.env.TZ = 'America/Los_Angeles'
    expect(formatDateWithOptions('2026-08-01', { month: 'long', year: 'numeric' })).toBe('август 2026 г.')
  })

  it('test_year_month_string_from_report_west_of_utc_is_same_month', () => {
    // ревью F-1080: BE отдаёт месяц отчёта как 'YYYY-MM' (strftime %Y-%m), не 'YYYY-MM-01'
    process.env.TZ = 'America/New_York'
    expect(formatMonthYear('2026-08')).toBe('Август 2026')
    expect(formatDateWithOptions('2026-08', { month: 'short', year: 'numeric' })).toMatch(/^авг/)
    expect(formatMonthYear('2026-13')).toBe('—')
  })

  it('test_datetime_with_zone_still_converted_to_local', () => {
    process.env.TZ = 'Asia/Tashkent'   // UTC+5: 22:00Z → следующий день
    expect(formatDate('2026-11-24T22:00:00Z')).toBe('25.11.2026')
  })

  it('test_invalid_and_empty_values_render_dash', () => {
    expect(formatDate('2026-13-45')).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate(null)).toBe('—')
  })
})
