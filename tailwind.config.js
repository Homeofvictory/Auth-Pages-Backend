/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.{html,ejs}',
  ],
  theme: {
    extend: {},
  },

    plugins: [
     require('@tailwindcss/forms'),
   ],

}

