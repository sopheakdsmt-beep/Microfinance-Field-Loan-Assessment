export function sameRecord(left: unknown, right: unknown): boolean {
  const strip = (value: unknown) => {
    if (!value || typeof value !== "object") return value;
    const copy = { ...(value as Record<string, unknown>) };
    delete copy.updatedAt;
    delete copy.createdAt;
    delete copy.syncStatus;
    return copy;
  };
  return JSON.stringify(strip(left)) === JSON.stringify(strip(right));
}
