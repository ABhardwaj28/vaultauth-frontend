import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The landing page lives in its own app folder but is served from "/" by this app.
      "@landing": fileURLToPath(new URL("./landing/src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Used by the landing page's live API checks (same origin in dev).
      "/va-api": {
        target: "https://api.vaultauth.proplays2312.eu.org",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/va-api/, ""),
      },
    },
  },
});
