/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./types/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Common layout classes
    'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-800', 'bg-gray-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600', 'bg-green-700',
    'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600', 'bg-red-700',
    'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-500', 'bg-yellow-600',
    'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600',
    'bg-slate-50', 'bg-slate-100', 'bg-slate-200', 'bg-slate-600', 'bg-slate-700', 'bg-slate-800',

    // Text colors
    'text-white', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-blue-600', 'text-blue-700', 'text-blue-800', 'text-green-600', 'text-green-700',
    'text-red-600', 'text-red-700', 'text-yellow-600', 'text-indigo-600', 'text-indigo-700',
    'text-purple-600', 'text-slate-600', 'text-slate-700', 'text-slate-800',

    // Text sizes
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',

    // Padding and margins
    'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8',
    'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8', 'pt-2', 'pt-4', 'pb-2', 'pb-4',
    'm-1', 'm-2', 'm-3', 'm-4', 'mx-auto', 'my-2', 'my-4', 'mt-1', 'mt-2', 'mt-4', 'mb-2', 'mb-4',

    // Borders and rounded corners
    'border', 'border-2', 'border-gray-200', 'border-gray-300', 'border-blue-200', 'border-green-200',
    'border-red-200', 'border-yellow-200', 'border-indigo-200', 'border-purple-200',
    'rounded', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',

    // Shadows
    'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',

    // Flexbox and grid
    'flex', 'flex-col', 'flex-row', 'items-center', 'items-start', 'items-end',
    'justify-center', 'justify-between', 'justify-start', 'justify-end',
    'grid', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4',

    // Width and height
    'w-full', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4', 'h-full', 'h-screen', 'min-h-screen',
    'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'max-w-4xl',

    // Common utilities
    'hidden', 'block', 'inline-block', 'relative', 'absolute', 'fixed', 'cursor-pointer',
    'hover:bg-blue-600', 'hover:bg-green-600', 'hover:text-blue-800', 'hover:shadow-lg',
    'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'transition', 'duration-200',
    'font-bold', 'font-semibold', 'font-medium', 'text-center', 'text-left', 'text-right',
    'uppercase', 'lowercase', 'capitalize'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      }
    },
  },
  plugins: [],
}
