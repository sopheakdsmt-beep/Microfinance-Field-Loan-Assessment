const KM_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const year = target.getUTCFullYear();
  const month = target.getUTCMonth();
  const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(d, dim);
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function formatISODate(iso: string, lang: "km" | "en"): string {
  const [y, m, d] = iso.split("-");
  const monthIndex = Number(m) - 1;
  if (!y || monthIndex < 0 || monthIndex > 11 || !d) return iso;
  const month = lang === "km" ? KM_MONTHS[monthIndex] : EN_MONTHS[monthIndex];
  return `${Number(d)} ${month} ${y}`;
}

export function formatTimestamp(ms: number, lang: "km" | "en"): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const iso = `${pick("year")}-${pick("month")}-${pick("day")}`;
  return `${formatISODate(iso, lang)} ${pick("hour")}:${pick("minute")}`;
}
