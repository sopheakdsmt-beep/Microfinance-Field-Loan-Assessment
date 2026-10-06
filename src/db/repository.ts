import { todayISO } from "../domain/dates";
import { db, uid } from "./db";
import {
  DEFAULT_SETTINGS,
  type Borrower,
  type FieldSettings,
  type LoanRecord,
  type PhotoRecord,
  type QueueItem,
  type SyncEntity,
} from "./types";

function touch<T extends { updatedAt: number; syncStatus: "pending" | "synced" }>(
  record: T,
  updatedAt: number,
): T {
  return { ...record, updatedAt, syncStatus: "pending" };
}

async function enqueue(entity: SyncEntity, entityId: string, op: QueueItem["op"], at: number) {
  const open = await db.queue
    .filter((item) => item.entity === entity && item.entityId === entityId && item.status !== "synced")
    .toArray();
  if (open.length > 0) {
    const [first, ...rest] = open;
    await db.queue.update(first.id, { op, createdAt: at, status: "queued", error: undefined });
    if (rest.length > 0) await db.queue.bulkDelete(rest.map((item) => item.id));
    return;
  }
  await db.queue.add({
    id: uid(),
    entity,
    entityId,
    op,
    createdAt: at,
    status: "queued",
  });
}

export async function saveBorrower(borrower: Borrower): Promise<void> {
  const updatedAt = Date.now();
  await db.borrowers.put(touch(borrower, updatedAt));
  await enqueue("borrower", borrower.id, "upsert", updatedAt);
}

export async function saveLoan(loan: LoanRecord): Promise<void> {
  const updatedAt = Date.now();
  await db.loans.put(touch(loan, updatedAt));
  await enqueue("loan", loan.id, "upsert", updatedAt);
}

export async function addPhoto(photo: PhotoRecord): Promise<void> {
  const updatedAt = Date.now();
  await db.photos.put(touch({ ...photo, updatedAt: photo.updatedAt || updatedAt }, updatedAt));
  await enqueue("photo", photo.id, "upsert", updatedAt);
}

export async function deletePhoto(id: string): Promise<void> {
  const at = Date.now();
  await db.photos.delete(id);
  await enqueue("photo", id, "delete", at);
}

export async function deleteBorrower(id: string): Promise<void> {
  const at = Date.now();
  const loans = await db.loans.where("borrowerId").equals(id).toArray();
  const photos = await db.photos.where("borrowerId").equals(id).toArray();
  await db.transaction("rw", db.borrowers, db.loans, db.photos, async () => {
    await db.borrowers.delete(id);
    await db.loans.bulkDelete(loans.map((loan) => loan.id));
    await db.photos.bulkDelete(photos.map((photo) => photo.id));
  });
  await enqueue("borrower", id, "delete", at);
  for (const loan of loans) await enqueue("loan", loan.id, "delete", at);
  for (const photo of photos) await enqueue("photo", photo.id, "delete", at);
}

export async function saveSettings(settings: FieldSettings): Promise<void> {
  await db.settings.put(settings);
}

export function blankBorrower(): Borrower {
  const now = Date.now();
  return {
    id: uid(),
    fullNameKm: "",
    fullNameEn: "",
    phone: "",
    nationalId: "",
    village: "",
    commune: "",
    district: "",
    province: "បាត់ដំបង",
    occupation: "",
    householdSize: 4,
    householdCurrency: "KHR",
    incomes: [{ id: uid(), label: "", amount: 0 }],
    expenses: [{ id: uid(), label: "", amount: 0 }],
    existingDebts: [],
    visitNote: "",
    demo: false,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  };
}

export function blankLoan(borrowerId: string, settings: FieldSettings): LoanRecord {
  return {
    id: uid(),
    borrowerId,
    principal: 2_000_000,
    currency: "KHR",
    annualRate: 18,
    termMonths: 24,
    method: "flat",
    disbursementDate: todayISO(),
    khrPerUsd: settings.khrPerUsd || DEFAULT_SETTINGS.khrPerUsd,
    purpose: "agriculture",
    updatedAt: Date.now(),
    syncStatus: "pending",
  };
}
