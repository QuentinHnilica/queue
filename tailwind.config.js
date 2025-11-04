/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.handlebars",
    "./public/**/*.js",
    "./public/**/*.html",
  ],
  safelist: [
    // Common dynamic states you’re using
    "text-primary",
    "bg-primary",
    "bg-primary-dark",
    "bg-primary-light",
    "hover:bg-primary",
    "hover:bg-primary-light",
    "group-hover:text-primary",
    "focus:ring-primary-light",
  ],
  theme: {
    extend: {
      colors: {
        primaryQ: "#df8327", // Custom orange color
        primaryQDark: "#8a4a12",
        primaryQLight: "#eaae73",
      },
      scale: {
        50: "0.5",
      },
    },
  },
  plugins: [require("daisyui")],
  // Optional: DaisyUI theme so its components match your palette
  daisyui: {
    themes: [
      {
        queueAdminPanel: {
          primary: "#df8327",
          "primary-content": "#120601",
          secondary: "#f3f4f6",
          "secondary-content": "#141415",
          accent: "#2e5374",
          "accent-content": "f3f4f6",
          neutral: "#9ca3af",
          "neutral-content": "#090a0b",
          "base-100": "#fefefe",
          "base-200": "#dddddd",
          "base-300": "#bdbdbd",
          "base-content": "#161616",
          info: "#f3f4f6",
          "info-content": "#141415",
          success: "#22c55e",
          "success-content": "#000e03",
          warning: "#fde047",
          "warning-content": "#161202",
          error: "#ef4444",
          "error-content": "#140202",
        },
      },
      "dark",
    ],
  },
};

