import { useMemo, useState } from "react";
import { buildSchedule } from "../domain/amortization";
import { summarizeCashFlow } from "../domain/cashflow";
import { formatMoney } from "../domain/money";
import type { Borrower, Lang, LoanRecord } from "../db/types";
import { t } from "../i18n";
import { Icon, paths } from "./Icons";

export function BorrowerRail({
  lang,
  borrowers,
  loans,
  selectedId,
  open,
  onSelect,
  onCreate,
}: {
  lang: Lang;
  borrowers: Borrower[];
  loans: LoanRecord[];
  selectedId: string | null;
  open: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const loansByBorrower = useMemo(() => {
    const map = new Map<string, LoanRecord>();
    for (const loan of loans) map.set(loan.borrowerId, loan);
    return map;
  }, [loans]);

  const filtered = borrowers.filter((borrower) => {
    const hay = [borrower.fullNameKm, borrower.fullNameEn, borrower.phone, borrower.village, borrower.province, borrower.nationalId]
      .join(" ")
      .toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <aside className={`rail ${open ? "is-open" : ""}`} data-testid="borrower-list">
      <div className="rail-head">
        <h1>{t(lang, "borrowers")}</h1>
        <button type="button" className="primary" onClick={onCreate}>
          <Icon d={paths.plus} />
          {t(lang, "newBorrower")}
        </button>
      </div>
      <label className="search">
        <Icon d={paths.search} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(lang, "search")}
          aria-label={t(lang, "search")}
        />
      </label>
      <div className="rail-list">
        {filtered.length === 0 && <p className="rail-empty">{t(lang, "noResults")}</p>}
        {filtered.map((borrower) => {
          const loan = loansByBorrower.get(borrower.id);
          const summary = loan ? summarize(borrower, loan) : null;
          const name = lang === "km" ? borrower.fullNameKm || borrower.fullNameEn : borrower.fullNameEn || borrower.fullNameKm;
          const alt = lang === "km" ? borrower.fullNameEn : borrower.fullNameKm;
          return (
            <button
              type="button"
              key={borrower.id}
              className={borrower.id === selectedId ? "borrower-btn active" : "borrower-btn"}
              aria-current={borrower.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(borrower.id)}
            >
              <span className="borrower-name">
                {name}
                {borrower.demo && <em>{t(lang, "demo")}</em>}
                {borrower.syncStatus === "pending" && <i className="pending-dot" title={t(lang, "savedLocal")} />}
              </span>
              {alt && <span className="borrower-alt">{alt}</span>}
              <span className="borrower-place">
                {borrower.village} · {borrower.province}
              </span>
              <span className="borrower-meta">
                {loan && <strong>{formatMoney(loan.principal, loan.currency)}</strong>}
                {summary?.dsr != null && (
                  <span className={`dsr-chip ${summary.band}`}>{Math.round(summary.dsr * 100)}%</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className="rail-foot">{t(lang, "localNote")}</p>
    </aside>
  );
}

function summarize(borrower: Borrower, loan: LoanRecord) {
  const schedule = buildSchedule({
    principal: loan.principal,
    annualRate: loan.annualRate,
    termMonths: loan.termMonths,
    method: loan.method,
    currency: loan.currency,
    disbursementDate: loan.disbursementDate,
  });
  return summarizeCashFlow({
    incomes: borrower.incomes,
    expenses: borrower.expenses,
    debts: borrower.existingDebts,
    proposedInstallment: schedule.regularPayment,
    loanCurrency: loan.currency,
    householdCurrency: borrower.householdCurrency,
    khrPerUsd: loan.khrPerUsd,
  });
}
