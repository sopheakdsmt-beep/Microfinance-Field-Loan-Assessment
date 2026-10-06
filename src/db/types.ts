import type { CashLine, ExistingDebt } from "../domain/cashflow";
import type { CollateralCategory, PurposeId } from "../domain/cambodia";
import type { Currency } from "../domain/money";
import type { RepaymentMethod } from "../domain/amortization";

export type SyncStatus = "pending" | "synced";
export type Lang = "km" | "en";

export interface Borrower {
  id: string;
  fullNameKm: string;
  fullNameEn: string;
  phone: string;
  nationalId: string;
  village: string;
  commune: string;
  district: string;
  province: string;
  occupation: string;
  householdSize: number;
  householdCurrency: Currency;
  incomes: CashLine[];
  expenses: CashLine[];
  existingDebts: ExistingDebt[];
  visitNote: string;
  demo: boolean;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface LoanRecord {
  id: string;
  borrowerId: string;
  principal: number;
  currency: Currency;
  annualRate: number;
  termMonths: number;
  method: RepaymentMethod;
  disbursementDate: string;
  khrPerUsd: number;
  purpose: PurposeId;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export interface PhotoRecord {
  id: string;
  borrowerId: string;
  category: CollateralCategory;
  note: string;
  image: Blob;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  gpsStatus: "captured" | "unavailable";
  capturedAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

export type SyncEntity = "borrower" | "loan" | "photo";

export interface QueueItem {
  id: string;
  entity: SyncEntity;
  entityId: string;
  op: "upsert" | "delete";
  createdAt: number;
  status: "queued" | "synced" | "error";
  error?: string;
}

export interface FieldSettings {
  key: "profile";
  officerNameKm: string;
  officerNameEn: string;
  branch: string;
  khrPerUsd: number;
  lang: Lang;
  /** Officer paused upload while out of signal, or for a village with no data plan. */
  pauseSync: boolean;
  lastSyncAt: number | null;
}

export const DEFAULT_SETTINGS: FieldSettings = {
  key: "profile",
  officerNameKm: "រិទ្ធ សុផាន់",
  officerNameEn: "Rith Sophan",
  branch: "សាខាបាត់ដំបង",
  khrPerUsd: 4100,
  lang: "km",
  pauseSync: false,
  lastSyncAt: null,
};
