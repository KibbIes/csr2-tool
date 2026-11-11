import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
// @ts-expect-error JS plugin alongside the TS vite config
import { PwaPlugin } from "./scripts/pwa-plugin.mjs";   
// @ts-expect-error JS plugin alongside the TS vite config
import { appEnvPlugin } from "./scripts/app-env-plugin.mjs";

export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "127.0.0.1", // Changed to localhost only for local use
    port: 8080,
    allowedHosts: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    appEnvPlugin(),
    PwaPlugin(),
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel", // You can change this to "node-server" later if you want
            serverDir: "./server",
          }),
        ]
      : []),
    viteReact(),
  ],
}));