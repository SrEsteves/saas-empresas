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
                // Trocando a fonte principal para Inter
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Criando a cor "brand" do seu sistema
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    500: '#6366f1', // Indigo padrão
                    600: '#4f46e5', // Hover
                    900: '#312e81', // Textos escuros
                }
            }
        },
    },

    plugins: [forms],
};