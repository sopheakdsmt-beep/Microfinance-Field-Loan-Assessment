import { formatPercent, type Schedule, type ScheduleRow } from "../domain/amortization";
import { toCsv } from "../domain/csv";
import { formatISODate, todayISO } from "../domain/dates";
import { convertAmount, formatMoney, toMinor, type Currency } from "../domain/money";
import type { Lang } from "../db/types";
import { fill, t } from "../i18n";
import { Icon, paths } from "./Icons";

export function ScheduleTable({
  lang,
  schedule,
  other,
  viewCurrency,
  contractCurrency,
  khrPerUsd,
  borrowerName,
  onViewCurrency,
}: {
  lang: Lang;
  schedule: Schedule;
  other: Schedule;
  viewCurrency: Currency;
  contractCurrency: Currency;
  khrPerUsd: number;
  borrowerName: string;
  onViewCurrency: (currency: Currency) => void;
}) {
  const today = todayISO();
  const rows = schedule.rows.map((row) => project(row, contractCurrency, viewCurrency, khrPerUsd));
  const totalPrincipal = sum(rows.map((row) => row.principal), viewCurrency);
  const totalInterest = sum(rows.map((row) => row.interest), viewCurrency);
  const totalPayable = sum(rows.map((row) => row.payment), viewCurrency);
  const last = rows[rows.length - 1];
  const regular = rows[0]?.payment ?? 0;
  const lastDiffers =
    last != null &&
    Math.abs(toMinor(last.payment, viewCurrency) - toMinor(regular, viewCurrency)) > (viewCurrency === "USD" ? 0 : 50);

  const download = () => {
    const csv = toCsv([
      [t(lang, "profile"), borrowerName],
      [t(lang, "method"), schedule.method === "flat" ? t(lang, "flat") : t(lang, "declining")],
      [t(lang, "principal"), formatMoney(schedule.principal, contractCurrency)],
      [t(lang, "rate"), `${schedule.annualRate}%`],
      [t(lang, "eir"), formatPercent(schedule.effectiveAnnualRate)],
      [t(lang, "exchange"), khrPerUsd],
      [],
      [t(lang, "period"), t(lang, "dueDate"), t(lang, "principal"), t(lang, "interest"), t(lang, "payment"), t(lang, "balance")],
      ...rows.map((row) => [
        row.period,
        row.dueDate,
        formatMoney(row.principal, viewCurrency),
        formatMoney(row.interest, viewCurrency),
        formatMoney(row.payment, viewCurrency),
        formatMoney(row.balance, viewCurrency),
      ]),
      ["", t(lang, "totals"), formatMoney(totalPrincipal, viewCurrency), formatMoney(totalInterest, viewCurrency), formatMoney(totalPayable, viewCurrency), formatMoney(0, viewCurrency)],
    ]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schedule-${schedule.termMonths}m.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="sheet" data-testid="schedule-pane">
      <div className="sheet-head">
        <div>
          <div className="section-label">
            <h2>{t(lang, "schedule")}</h2>
          </div>
          <p className="fine">
            {fill(t(lang, "rows"), { count: schedule.rows.length })}
            {" · "}
            {schedule.method === "flat" ? t(lang, "flat") : t(lang, "declining")}
            {" · "}
            {t(lang, "nominal")} {schedule.annualRate}%
            {" · "}
            {t(lang, "eir")} {formatPercent(schedule.effectiveAnnualRate)}
          </p>
        </div>
        <div className="sheet-tools">
          <div className="segment" role="radiogroup" aria-label={t(lang, "viewIn")}>
            {(["KHR", "USD"] as const).map((currency) => (
              <button
                type="button"
                key={currency}
                role="radio"
                aria-checked={viewCurrency === currency}
                onClick={() => onViewCurrency(currency)}
                data-testid={`view-${currency.toLowerCase()}`}
              >
                {currency === "KHR" ? t(lang, "khr") : t(lang, "usd")}
              </button>
            ))}
          </div>
          <button type="button" className="ghost" onClick={() => window.print()}>
            <Icon d={paths.print} />
            {t(lang, "print")}
          </button>
          <button type="button" className="ghost" onClick={download}>
            <Icon d={paths.download} />
            {t(lang, "csv")}
          </button>
        </div>
      </div>
      <div className="print-only">
        <h2>
          {borrowerName} · {t(lang, "schedule")}
        </h2>
        <p>
          {formatMoney(schedule.principal, contractCurrency)} · {schedule.annualRate}% · {schedule.termMonths} ·{" "}
          {schedule.method === "flat" ? t(lang, "flat") : t(lang, "declining")}
        </p>
      </div>
      {viewCurrency !== contractCurrency && (
        <p className="fine fx-note">
          {fill(t(lang, "fxNote"), {
            rate: khrPerUsd.toLocaleString("en-US"),
            currency: contractCurrency === "KHR" ? t(lang, "khr") : t(lang, "usd"),
          })}
        </p>
      )}
      <div className="schedule-scroll">
        <table className="ledger" data-testid="schedule-table" data-rows={rows.length}>
          <caption className="sr-only">{t(lang, "schedule")}</caption>
          <thead>
            <tr>
              <th scope="col">{t(lang, "period")}</th>
              <th scope="col">{t(lang, "dueDate")}</th>
              <th scope="col" className="num">
                {t(lang, "principal")}
              </th>
              <th scope="col" className="num">
                {t(lang, "interest")}
              </th>
              <th scope="col" className="num">
                {t(lang, "payment")}
              </th>
              <th scope="col" className="num">
                {t(lang, "balance")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const overdue = row.dueDate < today;
              return (
                <tr key={row.period} className={overdue ? "overdue" : undefined}>
                  <th scope="row">{row.period}</th>
                  <td>
                    {formatISODate(row.dueDate, lang)}
                    {overdue && <em className="overdue-tag">{t(lang, "overdue")}</em>}
                  </td>
                  <td className="num">{formatMoney(row.principal, viewCurrency)}</td>
                  <td className="num">{formatMoney(row.interest, viewCurrency)}</td>
                  <td className="num">{formatMoney(row.payment, viewCurrency)}</td>
                  <td className="num">{formatMoney(row.balance, viewCurrency)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={2}>
                {t(lang, "totals")}
              </th>
              <td className="num">{formatMoney(totalPrincipal, viewCurrency)}</td>
              <td className="num">{formatMoney(totalInterest, viewCurrency)}</td>
              <td className="num">{formatMoney(totalPayable, viewCurrency)}</td>
              <td className="num">{formatMoney(0, viewCurrency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="sheet-notes">
        {lastDiffers && last && <p>{fill(t(lang, "lastPayment"), { amount: formatMoney(last.payment, viewCurrency) })}</p>}
        {other.valid && (
          <p>
            {fill(t(lang, "compare"), {
              method: other.method === "flat" ? t(lang, "flat") : t(lang, "declining"),
              interest: formatMoney(other.totalInterest, contractCurrency),
              eir: formatPercent(other.effectiveAnnualRate),
            })}
          </p>
        )}
        <details>
          <summary>{t(lang, "howCalculated")}</summary>
          <p>{t(lang, "formula")}</p>
        </details>
      </div>
    </section>
  );
}

function project(row: ScheduleRow, from: Currency, to: Currency, khrPerUsd: number): ScheduleRow {
  if (from === to) return row;
  return {
    ...row,
    principal: convertAmount(row.principal, from, to, khrPerUsd),
    interest: convertAmount(row.interest, from, to, khrPerUsd),
    payment: convertAmount(row.payment, from, to, khrPerUsd),
    balance: convertAmount(row.balance, from, to, khrPerUsd),
  };
}

function sum(amounts: number[], currency: Currency): number {
  const minor = amounts.reduce((total, amount) => total + toMinor(amount, currency), 0);
  return currency === "USD" ? minor / 100 : minor;
}
