export const PROVINCES = [
  "បន្ទាយមានជ័យ",
  "បាត់ដំបង",
  "កំពង់ចាម",
  "កំពង់ឆ្នាំង",
  "កំពង់ស្ពឺ",
  "កំពង់ធំ",
  "កំពត",
  "កណ្ដាល",
  "កែប",
  "កោះកុង",
  "ក្រចេះ",
  "មណ្ឌលគិរី",
  "ភ្នំពេញ",
  "ព្រះវិហារ",
  "ព្រៃវែង",
  "ពោធិ៍សាត់",
  "រតនគិរី",
  "សៀមរាប",
  "ព្រះសីហនុ",
  "ស្ទឹងត្រែង",
  "ស្វាយរៀង",
  "តាកែវ",
  "ឧត្តរមានជ័យ",
  "ប៉ៃលិន",
  "ត្បូងឃ្មុំ",
] as const;

export const LOAN_PURPOSES = [
  { id: "agriculture", km: "កសិកម្ម", en: "Agriculture" },
  { id: "trade", km: "ជំនួញ", en: "Trade" },
  { id: "livestock", km: "បសុសត្វ", en: "Livestock" },
  { id: "vehicle", km: "យានយន្ត", en: "Vehicle" },
  { id: "education", km: "ការសិក្សា", en: "Education" },
  { id: "housing", km: "គេហដ្ឋាន", en: "Housing" },
  { id: "other", km: "ផ្សេងៗ", en: "Other" },
] as const;

export type PurposeId = (typeof LOAN_PURPOSES)[number]["id"];

export const COLLATERAL_CATEGORIES = [
  { id: "hard_title", km: "ប្លង់រឹង", en: "Hard title" },
  { id: "soft_title", km: "ប្លង់ទន់", en: "Soft title" },
  { id: "land_boundary", km: "ព្រំដី", en: "Land boundary" },
  { id: "vehicle", km: "យានយន្ត", en: "Vehicle" },
  { id: "other", km: "ផ្សេងៗ", en: "Other" },
] as const;

export type CollateralCategory = (typeof COLLATERAL_CATEGORIES)[number]["id"];

export function purposeLabel(id: string, lang: "km" | "en"): string {
  const found = LOAN_PURPOSES.find((item) => item.id === id);
  if (!found) return id;
  return lang === "km" ? found.km : found.en;
}

export function categoryLabel(id: string, lang: "km" | "en"): string {
  const found = COLLATERAL_CATEGORIES.find((item) => item.id === id);
  if (!found) return id;
  return lang === "km" ? found.km : found.en;
}
