import { defineConfig } from "vite";

export default defineConfig({
  base: "/ghost-market-unity/",
  server: {
    host: "127.0.0.1",
    port: 5173
  },
  build: {
    minify: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"]
        }
      }
    }
  }
});
