const path = require('node:path');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

module.exports = {
  plugins: [
    tailwindcss({
      config: path.join(__dirname, 'tailwind.config.js'),
    }),
    autoprefixer(),
  ],
};
