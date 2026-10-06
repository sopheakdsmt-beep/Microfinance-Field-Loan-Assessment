import Dexie, { type Table } from "dexie";
import type { Borrower, FieldSettings, LoanRecord, PhotoRecord, QueueItem } from "./types";

export class FieldDatabase extends Dexie {
  borrowers!: Table<Borrower, string>;
  loans!: Table<LoanRecord, string>;
  photos!: Table<PhotoRecord, string>;
  queue!: Table<QueueItem, string>;
  settings!: Table<FieldSettings, string>;

  constructor() {
    super("field-loan-assessment");
    this.version(1).stores({
      borrowers: "id, updatedAt, province, syncStatus",
      loans: "id, borrowerId, updatedAt, syncStatus",
      photos: "id, borrowerId, capturedAt, syncStatus",
      queue: "id, status, createdAt, entityId",
      settings: "key",
    });
  }
}

export const db = new FieldDatabase();

export function uid(): string {
  return crypto.randomUUID();
}
