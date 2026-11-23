import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/va-api": {
        target: "https://api.vaultauth.proplays2312.eu.org",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/va-api/, ""),
      },
    },
  },
});
