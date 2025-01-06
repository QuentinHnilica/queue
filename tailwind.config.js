module.exports = {
  content: [
    './views/*.handlebars',  // Your Handlebars template files
    './public/**/*.js',  // Optional: Include any custom JavaScript
  ],
  safelist: [
    'border-primaryQDark',
    'bg-primaryQ',
    'bg-primaryQDark',
    'from-primaryQ',
    'from-primaryQDark',
    'from-primaryQLight',
    'hover:bg-primaryQDark:hover',
    'hover:bg-primaryQLight:hover',
    'focus:ring-primaryQLight:focus',
    'group-hover:text-primaryQ',
    'group-hover:text-primaryQDark',
  ],
  theme: {
    extend: {
      colors: {
        primaryQ: '#df8327',  // Custom orange color
        primaryQDark: '#b7691b',
        primaryQLight: '#eaae73',
      },
      scale: {
        '50': '0.5',
      },
    },
  },
  plugins: [],
};
 