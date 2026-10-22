/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // ✅ Disable unused features
  corePlugins: {
    // Disable yang tidak dipakai
    preflight: true,
    container: false, // Jika tidak pakai container
    accessibility: true,
    // Bisa disable lebih banyak sesuai kebutuhan
  },
  
  theme: {
    extend: {
      // Hanya tambahkan yang benar-benar dipakai
    },
  },
  
  plugins: [
    // Hanya plugin yang dipakai
  ],
  
  // ✅ IMPORTANT: Purge unused CSS agresif
  safelist: [],
}