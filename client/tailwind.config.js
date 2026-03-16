/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1A3C5E',
          light: '#2A5C8E',
          dark: '#0F2840',
        },
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA6F10',
          light: '#FFF3E8',
        },
        surface: '#FFFFFF',
        background: '#F8F7F4',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#6B7280',
        border: '#E5E3DF',
      },
      borderRadius: {
        DEFAULT: '10px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08)',
        elevated: '0 4px 12px rgba(0,0,0,0.1)',
        modal: '0 8px 30px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}
