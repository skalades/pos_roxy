import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                heading: ['Outfit', 'sans-serif'],
            },
            colors: {
                roxy: {
                    canvas: '#f8fafc', // slate-50
                    surface: '#ffffff',
                    border: '#e2e8f0', // slate-200
                    primary: '#0f766e', // teal-700
                    primaryHover: '#115e59', // teal-800
                    textMain: '#334155', // slate-700
                    textMuted: '#64748b', // slate-500
                    accent: '#1e293b', // slate-800 / navy
                }
            }
        },
    },

    plugins: [forms],
};
