import { db } from "./db";
import { DEFAULT_SETTINGS, type Borrower, type LoanRecord } from "./types";

const syncedAt = Date.parse("2026-10-06T01:10:00Z");

function borrower(partial: Omit<Borrower, "syncStatus" | "createdAt" | "updatedAt" | "demo"> & { demo?: boolean }): Borrower {
  return {
    demo: true,
    createdAt: syncedAt,
    updatedAt: syncedAt,
    syncStatus: "synced",
    ...partial,
  };
}

function loan(partial: Omit<LoanRecord, "syncStatus" | "updatedAt">): LoanRecord {
  return { ...partial, updatedAt: syncedAt, syncStatus: "synced" };
}

const borrowers: Borrower[] = [
  borrower({
    id: "seed-vanna",
    fullNameKm: "សុខ វណ្ណា",
    fullNameEn: "Sok Vanna",
    phone: "012 000 101",
    nationalId: "DEMO-1001",
    village: "ភូមិស្រែថ្មី",
    commune: "ឃុំអូរម៉ាល់",
    district: "ស្រុកបាណន់",
    province: "បាត់ដំបង",
    occupation: "ស្រូវ និងបន្លែ",
    householdSize: 5,
    householdCurrency: "KHR",
    visitNote: "ដីស្រែនៅជិតផ្លូវភូមិ។ គ្រួសារមានគោ ២។ សុំថតប្លង់រឹង និងព្រំដីខាងកើត។",
    incomes: [
      { id: "vanna-inc-1", label: "ស្រូវ", amount: 1_400_000 },
      { id: "vanna-inc-2", label: "បសុសត្វ", amount: 350_000 },
    ],
    expenses: [
      { id: "vanna-exp-1", label: "អាហារ", amount: 650_000 },
      { id: "vanna-exp-2", label: "សាលា", amount: 120_000 },
      { id: "vanna-exp-3", label: "ដឹកជញ្ជូន", amount: 80_000 },
    ],
    existingDebts: [
      { id: "vanna-debt-1", lender: "សហគមន៍សន្សំ", monthlyPayment: 200_000, balance: 1_200_000 },
    ],
  }),
  borrower({
    id: "seed-chantra",
    fullNameKm: "មាស ចន្ទ្រា",
    fullNameEn: "Meas Chantra",
    phone: "012 000 202",
    nationalId: "DEMO-1002",
    village: "ភូមិផ្សារ",
    commune: "សង្កាត់បឹងកុក",
    district: "ក្រុងកំពង់ចាម",
    province: "កំពង់ចាម",
    occupation: "លក់ដូរផ្សារ",
    householdSize: 4,
    householdCurrency: "KHR",
    visitNote: "តូបនៅផ្សារព្រឹក។ ចង់បន្ថែមទំនិញមុនចូលឆ្នាំ។",
    incomes: [{ id: "chantra-inc-1", label: "លក់ដូរ", amount: 1_200_000 }],
    expenses: [
      { id: "chantra-exp-1", label: "អាហារ", amount: 480_000 },
      { id: "chantra-exp-2", label: "ជួលទីតាំង", amount: 150_000 },
    ],
    existingDebts: [
      { id: "chantra-debt-1", lender: "មីក្រូហិរញ្ញវត្ថុ", monthlyPayment: 350_000, balance: 2_400_000 },
    ],
  }),
  borrower({
    id: "seed-lyhour",
    fullNameKm: "ហ៊ុន លីហួរ",
    fullNameEn: "Hun Lyhour",
    phone: "012 000 303",
    nationalId: "DEMO-1003",
    village: "ភូមិវត្ត",
    commune: "សង្កាត់ស្វាយដង្គំ",
    district: "ក្រុងសៀមរាប",
    province: "សៀមរាប",
    occupation: "បើកម៉ូតូឌុប",
    householdSize: 3,
    householdCurrency: "KHR",
    visitNote: "ម៉ូតូឌុបឆ្នាំ២០១៩ ប្រើជាទ្រព្យបញ្ចាំ។ សុំថតផ្លាកលេខ ពីមុខ និងពីចំហៀង។",
    incomes: [{ id: "lyhour-inc-1", label: "បើកម៉ូតូឌុប", amount: 900_000 }],
    expenses: [
      { id: "lyhour-exp-1", label: "ប្រេង", amount: 250_000 },
      { id: "lyhour-exp-2", label: "អាហារ", amount: 400_000 },
    ],
    existingDebts: [
      { id: "lyhour-debt-1", lender: "ញាតិ", monthlyPayment: 250_000, balance: 800_000 },
    ],
  }),
  borrower({
    id: "seed-sreymom",
    fullNameKm: "ទេព ស្រីម៉ៅ",
    fullNameEn: "Tep Sreymom",
    phone: "012 000 404",
    nationalId: "DEMO-1004",
    village: "ភូមិត្រពាំង",
    commune: "ឃុំព្រៃផ្ដៅ",
    district: "ស្រុកបាទី",
    province: "តាកែវ",
    occupation: "កម្មកររោងចក្រ",
    householdSize: 4,
    householdCurrency: "KHR",
    visitNote: "ប្លង់ទន់លើដីទំហំ ១២ម × ២៥ម។ សុំថតផ្ទះ និងព្រំទាំងបួន។",
    incomes: [
      { id: "srey-inc-1", label: "ប្រាក់ខែរោងចក្រ", amount: 1_100_000 },
      { id: "srey-inc-2", label: "ចំណូលស្វាមី", amount: 800_000 },
    ],
    expenses: [
      { id: "srey-exp-1", label: "អាហារ", amount: 700_000 },
      { id: "srey-exp-2", label: "សាលា", amount: 180_000 },
      { id: "srey-exp-3", label: "ថ្នាំ", amount: 80_000 },
    ],
    existingDebts: [],
  }),
];

borrowers.forEach((record, index) => {
  record.updatedAt = syncedAt + (borrowers.length - index) * 1000;
});

const loans: LoanRecord[] = [
  loan({
    id: "loan-vanna",
    borrowerId: "seed-vanna",
    principal: 6_000_000,
    currency: "KHR",
    annualRate: 18,
    termMonths: 24,
    method: "flat",
    disbursementDate: "2026-10-06",
    khrPerUsd: 4100,
    purpose: "agriculture",
  }),
  loan({
    id: "loan-chantra",
    borrowerId: "seed-chantra",
    principal: 1200,
    currency: "USD",
    annualRate: 18,
    termMonths: 24,
    method: "flat",
    disbursementDate: "2026-10-06",
    khrPerUsd: 4100,
    purpose: "trade",
  }),
  loan({
    id: "loan-lyhour",
    borrowerId: "seed-lyhour",
    principal: 2000,
    currency: "USD",
    annualRate: 24,
    termMonths: 36,
    method: "flat",
    disbursementDate: "2026-10-06",
    khrPerUsd: 4100,
    purpose: "vehicle",
  }),
  loan({
    id: "loan-sreymom",
    borrowerId: "seed-sreymom",
    principal: 10_000_000,
    currency: "KHR",
    annualRate: 15,
    termMonths: 36,
    method: "declining",
    disbursementDate: "2026-10-06",
    khrPerUsd: 4100,
    purpose: "housing",
  }),
];

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.settings.get("profile");
  if (!existing) await db.settings.put({ ...DEFAULT_SETTINGS, lastSyncAt: syncedAt });
  const count = await db.borrowers.count();
  if (count > 0) return;
  await db.transaction("rw", db.borrowers, db.loans, async () => {
    await db.borrowers.bulkAdd(borrowers);
    await db.loans.bulkAdd(loans);
  });
}
