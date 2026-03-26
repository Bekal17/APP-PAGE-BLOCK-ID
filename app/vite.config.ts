import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "openfort-fix",
      resolveId(id) {
        if (id === "../constants/openfort.js") {
          return { id: require.resolve("@openfort/react/dist/constants/openfort.js") };
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@openfort/react", "@openfort/openfort-js"],
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    target: "esnext",
    commonjsOptions: {
      include: [/@openfort/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: (id) => {
        return false;
      },
      output: {
        manualChunks: (id) => {
          if (id.includes("@openfort")) {
            return "openfort";
          }
        },
      },
    },
  },
});
