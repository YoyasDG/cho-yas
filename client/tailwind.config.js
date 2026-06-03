const path = require('node:path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src', '**', '*.{ts,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      boxShadow: {
        panel: '0 24px 60px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
