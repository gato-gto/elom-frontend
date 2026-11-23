import { describe, it, expect } from 'vitest'
import { createLineChartConfig, createBarChartConfig } from '@/utils/chartUtils'

// F-1066 (ревью F-1062): `dataset.tension || 0.4` превращал явный 0 в 0.4 — сглаживание, которое D-030
// убирает в отчёте по периодам, оставалось. То же для fill:false/borderWidth:0/pointRadius:0.
describe('F-1066 chartUtils: явные 0/false не заменяются умолчаниями', () => {
  it('line: tension 0, pointRadius 0, borderWidth 0 сохраняются', () => {
    const cfg = createLineChartConfig({ labels: ['a'], datasets: [{ label: 'x', data: [1], tension: 0, pointRadius: 0, borderWidth: 0 } as never], type: 'line' })
    const ds = (cfg.data.datasets as Array<Record<string, unknown>>)[0]
    expect(ds.tension).toBe(0)
    expect(ds.pointRadius).toBe(0)
    expect(ds.borderWidth).toBe(0)
  })

  it('line: без значений — прежние умолчания', () => {
    const cfg = createLineChartConfig({ labels: ['a'], datasets: [{ label: 'x', data: [1] } as never], type: 'line' })
    const ds = (cfg.data.datasets as Array<Record<string, unknown>>)[0]
    expect(ds.tension).toBe(0.4)
    expect(ds.borderWidth).toBe(2)
  })

  it('bar: borderWidth 0 сохраняется', () => {
    const cfg = createBarChartConfig({ labels: ['a'], datasets: [{ label: 'x', data: [1], borderWidth: 0 } as never], type: 'bar' })
    expect((cfg.data.datasets as Array<Record<string, unknown>>)[0].borderWidth).toBe(0)
  })
})
