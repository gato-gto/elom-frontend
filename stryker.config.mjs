// Stryker — мутационное тестирование фронтенда (F-1137). Ставили 9.6.1: 10.x требует Node ≥ 22, на сервере Node 20.
// На проде (≈6 ГБ) — ТОЛЬКО под ограничением памяти и на изменённых файлах:
//   systemd-run --scope -q -p MemoryMax=1500M -p MemorySwapMax=0 npx stryker run --mutate src/utils/deleteRules.ts
// Полный прогон по всему src на этом сервере не запускать.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.config.ts', related: true },
  // по умолчанию — только утилиты; для своей правки всегда --mutate <файлы диффа>
  mutate: ['src/utils/**/*.ts', '!src/**/__tests__/**', '!src/**/*.test.ts', '!src/**/*.d.ts'],
  // ведущий «/» — только корень проекта (без него 'docs' выкинул бы и src/docs; ревью-29)
  ignorePatterns: ['/dist', '/docs', '/reports', '/tools', '/tests/e2e', '/e2e', '/playwright-report', '/test-results',
    '/coverage', '/.idea'],
  concurrency: 1,
  coverageAnalysis: 'perTest',
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
  thresholds: { high: 90, low: 75, break: null },
}
