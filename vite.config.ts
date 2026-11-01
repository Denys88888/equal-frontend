import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Pi Browser runs on the phone's system WebView, and phones that stopped
    // getting WebView updates still use WebView 83 and older. With Vite's
    // default target (current browsers) syntax like `??=` shipped as is, and
    // on those phones Profile and Chat failed to load at all ("Unexpected
    // token '='"). esbuild lowers the syntax to what they understand.
    target: ['es2018', 'chrome64', 'safari12'],
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router'],
          ui: ['framer-motion', 'lucide-react'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
});
