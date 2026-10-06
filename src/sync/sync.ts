import { db } from "../db/db";
import type { PhotoRecord, QueueItem, SyncEntity } from "../db/types";

type TableName = "borrowers" | "loans" | "photos";

const tables: Record<SyncEntity, TableName> = {
  borrower: "borrowers",
  loan: "loans",
  photo: "photos",
};

let flushing = false;
let rerun = false;
const listeners = new Set<(syncing: boolean) => void>();

export function subscribeSync(listener: (syncing: boolean) => void): () => void {
  listeners.add(listener);
  listener(flushing);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) listener(flushing);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x4000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function payloadFor(item: QueueItem): Promise<Record<string, unknown>> {
  if (item.op === "delete") {
    return { entity: item.entity, entityId: item.entityId, op: item.op };
  }
  const table = db[tables[item.entity]];
  const record = await table.get(item.entityId);
  if (!record) return { entity: item.entity, entityId: item.entityId, op: "delete" };
  if (item.entity === "photo") {
    const photo = record as PhotoRecord;
    const { image, ...rest } = photo;
    return {
      entity: item.entity,
      entityId: item.entityId,
      op: item.op,
      record: {
        ...rest,
        imageBase64: await blobToBase64(image),
        imageType: image.type || "image/jpeg",
      },
    };
  }
  return { entity: item.entity, entityId: item.entityId, op: item.op, record };
}

async function markSynced(item: QueueItem, sentUpdatedAt: number | null): Promise<void> {
  const fresh = await db.queue.get(item.id);
  if (!fresh || fresh.createdAt > item.createdAt) return;
  if (item.op === "upsert") {
    const table = db[tables[item.entity]];
    const record = await table.get(item.entityId);
    if (record && sentUpdatedAt != null && record.updatedAt > sentUpdatedAt) return;
    if (record) await table.update(item.entityId, { syncStatus: "synced" });
  }
  await db.queue.update(item.id, { status: "synced", error: undefined });
}

async function runOnce(): Promise<void> {
  const items = await db.queue.where("status").anyOf(["queued", "error"]).sortBy("createdAt");
  for (const item of items) {
    const current = item.op === "delete" ? null : await db[tables[item.entity]].get(item.entityId);
    const sentUpdatedAt = current && "updatedAt" in current ? current.updatedAt : null;
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await payloadFor(item)),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await markSynced(item, sentUpdatedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "sync failed";
      const fresh = await db.queue.get(item.id);
      if (!fresh || fresh.createdAt > item.createdAt) continue;
      await db.queue.update(item.id, { status: "error", error: message });
    }
  }
  const remaining = await db.queue.where("status").anyOf(["queued", "error"]).count();
  if (remaining === 0) {
    await db.settings.update("profile", { lastSyncAt: Date.now() });
  }
}

export async function flushSync(enabled: boolean): Promise<void> {
  if (!enabled) return;
  if (flushing) {
    rerun = true;
    return;
  }
  flushing = true;
  notify();
  try {
    do {
      rerun = false;
      await runOnce();
    } while (rerun);
  } finally {
    flushing = false;
    notify();
  }
}

export async function requestSync(): Promise<void> {
  const settings = await db.settings.get("profile");
  const online = typeof navigator === "undefined" ? false : navigator.onLine;
  await flushSync(online && !settings?.pauseSync);
}
