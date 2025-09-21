module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Используем browserslist для определения целевых браузеров
        useBuiltIns: 'usage',
        corejs: 3,
        // Включаем поддержку модулей ES6
        modules: false,
        // Включаем отладку
        debug: false,
        // Включаем поддержку async/await
        targets: {
          browsers: [
            'last 2 versions',
            '> 1%',
            'not dead',
            'Chrome >= 80',
            'Firefox >= 78',
            'Safari >= 13.1',
            'Edge >= 80'
          ]
        }
      }
    ]
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 3,
        helpers: true,
        regenerator: true,
        useESModules: false
      }
    ]
  ]
};
