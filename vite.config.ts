import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

interface SyncBody {
  entity?: string;
  entityId?: string;
  op?: string;
  record?: Record<string, unknown> | null;
}

function syncApi() {
  const root = path.resolve("data");
  const inboxPath = path.join(root, "sync-inbox.json");
  const photoDir = path.join(root, "photos");

  const readInbox = (): SyncBody[] => {
    if (!fs.existsSync(inboxPath)) return [];
    return JSON.parse(fs.readFileSync(inboxPath, "utf8")) as SyncBody[];
  };

  const handler = (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
    const url = req.url?.split("?")[0];
    if (url !== "/api/sync") {
      next();
      return;
    }
    if (req.method === "GET") {
      const items = readInbox();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ count: items.length, items }));
      return;
    }
    if (req.method !== "POST") {
      next();
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as SyncBody;
        let record = body.record ?? null;
        if (record && typeof record.imageBase64 === "string") {
          fs.mkdirSync(photoDir, { recursive: true });
          const bytes = Buffer.from(record.imageBase64, "base64");
          const filename = `${body.entityId ?? "photo"}.jpg`;
          fs.writeFileSync(path.join(photoDir, filename), bytes);
          const stored: Record<string, unknown> = { ...record, imageFile: filename, imageBytes: bytes.length };
          delete stored.imageBase64;
          record = stored;
        }
        const items = readInbox();
        items.push({
          entity: body.entity,
          entityId: body.entityId,
          op: body.op,
          record,
          receivedAt: new Date().toISOString(),
        } as SyncBody);
        fs.mkdirSync(root, { recursive: true });
        fs.writeFileSync(inboxPath, JSON.stringify(items, null, 2));
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
      } catch (error) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "bad payload" }));
      }
    });
  };

  return {
    name: "field-sync-api",
    configureServer(server: { middlewares: { use: (fn: typeof handler) => void } }) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof handler) => void } }) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    syncApi(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "វាយតម្លៃឥណទាន · Field Loan Assessment",
        short_name: "ឥណទាន",
        description: "Offline tablet workspace for microfinance field assessment in Khmer Riel and US dollars.",
        theme_color: "#0c2419",
        background_color: "#efe6d4",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2,webmanifest}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
