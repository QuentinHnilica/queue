module.exports = {
  content: [
    './views/*.handlebars',  // Your Handlebars template files
    './public/**/*.js',  // Optional: Include any custom JavaScript
  ],
  theme: {
    extend: {
      colors: {
        primaryQ: '#df8327',  // Custom orange color
        primaryQDark: '#b7691b',
        primaryQLight: '#eaae73'
      },
      scale:{
        '50': '0.5',
      }
    },
  },
  plugins: [],
};