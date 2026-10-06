import { formatTimestamp } from "../domain/dates";
import type { Lang } from "../db/types";

export interface StampMeta {
  borrowerName: string;
  categoryLabel: string;
  capturedAt: number;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  officer: string;
  lang: Lang;
}

export function stampLines(meta: StampMeta): string[] {
  const when = formatTimestamp(meta.capturedAt, meta.lang);
  const gps =
    meta.latitude == null || meta.longitude == null
      ? meta.lang === "km"
        ? "មិនមាន GPS"
        : "GPS unavailable"
      : `${meta.latitude.toFixed(6)}, ${meta.longitude.toFixed(6)} · ±${Math.round(meta.accuracy ?? 0)}m`;
  return [meta.categoryLabel, meta.borrowerName, gps, `${when} ICT · ${meta.officer}`];
}

export function readGps(timeout = 10000): Promise<{ latitude: number; longitude: number; accuracy: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 60_000 },
    );
  });
}

export async function stampPhoto(file: Blob, meta: StampMeta): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1600;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const bar = Math.round(Math.max(108, width * 0.12));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height + bar;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(bitmap, 0, 0, width, height);
  context.fillStyle = "#10261c";
  context.fillRect(0, height, width, bar);
  context.fillStyle = "#e7c56a";
  context.fillRect(0, height, 8, bar);
  if (document.fonts?.load) {
    await document.fonts.load('700 28px "Kantumruy Pro"');
  }
  const lines = stampLines(meta);
  const fontSize = Math.max(16, Math.round(width / 42));
  context.textBaseline = "top";
  lines.forEach((line, index) => {
    context.fillStyle = index === 0 ? "#e7c56a" : "#f6f1e6";
    context.font = `${index === 0 ? 700 : 500} ${index === 0 ? fontSize : fontSize - 1}px "Kantumruy Pro", "IBM Plex Sans", sans-serif`;
    context.fillText(line, 22, height + 14 + index * (fontSize + 8), width - 40);
  });
  bitmap.close?.();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("stamp"))), "image/jpeg", 0.82);
  });
  return blob;
}
