/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'

export default {
    content: ['./index.html', './src/**/*.{vue,ts,js,tsx,jsx}'],
    theme: {extend: {}},
    plugins: [daisyui],
    daisyui: {themes: ['light', 'dark']},
}
