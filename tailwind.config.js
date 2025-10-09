/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    // Spacing
    'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-5', 'space-y-6', 'space-y-8', 'space-y-10', 'space-y-12',
    'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4', 'space-x-5', 'space-x-6', 'space-x-8', 'space-x-10', 'space-x-12',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-5', 'gap-6', 'gap-8', 'gap-10', 'gap-12',
    
    // Padding & Margin
    'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
    'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12',
    'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12',
    'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12',
    'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8', 'ml-10', 'ml-12',
    'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8', 'mr-10', 'mr-12',
    'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8', 'mt-10', 'mt-12',
    
    // Grid & Flex
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 'grid-cols-6',
    'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5', 'md:grid-cols-6',
    'flex-1', 'flex-2', 'flex-3', 'flex-4', 'flex-5', 'flex-6',
    'flex-col', 'flex-row', 'flex-wrap', 'flex-nowrap',
    
    // Width & Height
    'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-40', 'w-48', 'w-56', 'w-64', 'w-72', 'w-80', 'w-96',
    'w-full', 'w-1/2', 'w-1/3', 'w-1/4', 'w-2/3', 'w-3/4', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5',
    'md:w-1/2', 'md:w-1/3', 'md:w-1/4', 'md:w-2/3', 'md:w-3/4', 'md:w-1/5', 'md:w-2/5', 'md:w-3/5', 'md:w-4/5',
    'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-40', 'h-48', 'h-56', 'h-64', 'h-72', 'h-80', 'h-96',
    'h-full', 'h-1/2', 'h-1/3', 'h-1/4', 'h-2/3', 'h-3/4', 'h-1/5', 'h-2/5', 'h-3/5', 'h-4/5',
    
    // Colors
    'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-blue-50', 'text-blue-100', 'text-blue-200', 'text-blue-300', 'text-blue-400', 'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800', 'text-blue-900',
    'text-red-50', 'text-red-100', 'text-red-200', 'text-red-300', 'text-red-400', 'text-red-500', 'text-red-600', 'text-red-700', 'text-red-800', 'text-red-900',
    'text-green-50', 'text-green-100', 'text-green-200', 'text-green-300', 'text-green-400', 'text-green-500', 'text-green-600', 'text-green-700', 'text-green-800', 'text-green-900',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800', 'bg-blue-900',
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-red-800', 'bg-red-900',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900',
    'border-gray-50', 'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-500', 'border-gray-600', 'border-gray-700', 'border-gray-800', 'border-gray-900',
    'border-blue-50', 'border-blue-100', 'border-blue-200', 'border-blue-300', 'border-blue-400', 'border-blue-500', 'border-blue-600', 'border-blue-700', 'border-blue-800', 'border-blue-900',
    'border-red-50', 'border-red-100', 'border-red-200', 'border-red-300', 'border-red-400', 'border-red-500', 'border-red-600', 'border-red-700', 'border-red-800', 'border-red-900',
    'border-green-50', 'border-green-100', 'border-green-200', 'border-green-300', 'border-green-400', 'border-green-500', 'border-green-600', 'border-green-700', 'border-green-800', 'border-green-900',
    
    // Dark mode variants
    'dark:text-gray-50', 'dark:text-gray-100', 'dark:text-gray-200', 'dark:text-gray-300', 'dark:text-gray-400', 'dark:text-gray-500', 'dark:text-gray-600', 'dark:text-gray-700', 'dark:text-gray-800', 'dark:text-gray-900',
    'dark:bg-gray-50', 'dark:bg-gray-100', 'dark:bg-gray-200', 'dark:bg-gray-300', 'dark:bg-gray-400', 'dark:bg-gray-500', 'dark:bg-gray-600', 'dark:bg-gray-700', 'dark:bg-gray-800', 'dark:bg-gray-900',
    'dark:border-gray-50', 'dark:border-gray-100', 'dark:border-gray-200', 'dark:border-gray-300', 'dark:border-gray-400', 'dark:border-gray-500', 'dark:border-gray-600', 'dark:border-gray-700', 'dark:border-gray-800', 'dark:border-gray-900',
    
    // Other utilities
    'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    'cursor-pointer', 'cursor-not-allowed', 'cursor-default',
    'border', 'border-2', 'border-4', 'border-8',
    'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
    'font-medium', 'font-semibold', 'font-bold',
    'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
    'transition-colors', 'transition-transform', 'duration-200', 'duration-300', 'duration-500',
    'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:ring-red-500', 'focus:ring-green-500',
    'focus:border-blue-500', 'focus:border-red-500', 'focus:border-green-500',
    'hover:bg-gray-100', 'hover:bg-blue-100', 'hover:bg-red-100', 'hover:bg-green-100',
    'hover:text-blue-800', 'hover:text-red-800', 'hover:text-green-800',
    'hover:border-gray-400', 'hover:border-blue-400', 'hover:border-red-400', 'hover:border-green-400',
    'disabled:bg-gray-50', 'disabled:text-gray-500', 'disabled:cursor-not-allowed',
    'resize-vertical', 'min-h-[100px]', 'max-h-60', 'overflow-y-auto',
    'absolute', 'relative', 'top-full', 'left-0', 'right-0', 'inset-0',
    'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
    'scale-[1.01]', 'border-dashed', 'border-transparent',
    'inline-flex', 'items-center', 'justify-center', 'justify-between',
    'block', 'inline-block', 'hidden', 'md:block',
    'list-disc', 'list-inside', 'list-none',
    'file:mr-4', 'file:py-2', 'file:px-4', 'file:rounded-md', 'file:border-0', 'file:text-sm', 'file:font-medium', 'file:bg-blue-50', 'file:text-blue-700', 'hover:file:bg-blue-100',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ["light", "dark"],
    darkTheme: "dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
    // Отключаем неиспользуемые компоненты для устранения предупреждений
    components: {
      // Отключаем компоненты, которые используют @property
     // "progress": false,
     // "radial-progress": false,
    }
  },
}
