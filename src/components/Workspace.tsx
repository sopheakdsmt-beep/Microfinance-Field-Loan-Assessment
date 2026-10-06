import { useEffect, useMemo, useState } from "react";
import { buildSchedule, formatPercent } from "../domain/amortization";
import { summarizeCashFlow } from "../domain/cashflow";
import { LOAN_PURPOSES, purposeLabel } from "../domain/cambodia";
import { formatMoney, type Currency } from "../domain/money";
import { uid } from "../db/db";
import type { Borrower, Lang, LoanRecord, PhotoRecord } from "../db/types";
import { bandLabel, t } from "../i18n";
import { sameRecord } from "../lib/sameRecord";
import { BorrowerDialog } from "./BorrowerDialog";
import { CashFlowEditor } from "./CashFlowEditor";
import { NumericField } from "./NumericField";
import { PhotoVault } from "./PhotoVault";
import { ScheduleTable } from "./ScheduleTable";

const TERMS = [12, 18, 24, 36, 48];

export function Workspace({
  lang,
  borrower,
  loan,
  photos,
  officer,
  onSaveBorrower,
  onSaveLoan,
  onAddPhoto,
  onDeletePhoto,
  onDeleteBorrower,
}: {
  lang: Lang;
  borrower: Borrower;
  loan: LoanRecord;
  photos: PhotoRecord[];
  officer: string;
  onSaveBorrower: (borrower: Borrower) => void;
  onSaveLoan: (loan: LoanRecord) => void;
  onAddPhoto: (photo: PhotoRecord) => void;
  onDeletePhoto: (id: string) => void;
  onDeleteBorrower: (id: string) => void;
}) {
  const [person, setPerson] = useState(borrower);
  const [terms, setTerms] = useState(loan);
  const [viewCurrency, setViewCurrency] = useState<Currency>(loan.currency);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (sameRecord(person, borrower)) return;
    const timer = window.setTimeout(() => onSaveBorrower(person), 400);
    return () => window.clearTimeout(timer);
  }, [person, borrower, onSaveBorrower]);

  useEffect(() => {
    if (sameRecord(terms, loan)) return;
    const timer = window.setTimeout(() => onSaveLoan(terms), 400);
    return () => window.clearTimeout(timer);
  }, [terms, loan, onSaveLoan]);

  const schedule = useMemo(
    () =>
      buildSchedule({
        principal: terms.principal,
        annualRate: terms.annualRate,
        termMonths: terms.termMonths,
        method: terms.method,
        currency: terms.currency,
        disbursementDate: terms.disbursementDate,
      }),
    [terms],
  );
  const other = useMemo(
    () =>
      buildSchedule({
        principal: terms.principal,
        annualRate: terms.annualRate,
        termMonths: terms.termMonths,
        method: terms.method === "flat" ? "declining" : "flat",
        currency: terms.currency,
        disbursementDate: terms.disbursementDate,
      }),
    [terms],
  );
  const cash = useMemo(
    () =>
      summarizeCashFlow({
        incomes: person.incomes,
        expenses: person.expenses,
        debts: person.existingDebts,
        proposedInstallment: schedule.regularPayment,
        loanCurrency: terms.currency,
        householdCurrency: person.householdCurrency,
        khrPerUsd: terms.khrPerUsd,
      }),
    [person, schedule.regularPayment, terms.currency, terms.khrPerUsd],
  );

  const name = lang === "km" ? person.fullNameKm || person.fullNameEn : person.fullNameEn || person.fullNameKm;
  const place = [person.village, person.commune, person.district, person.province].filter(Boolean).join(" · ");
  const dsrText = cash.dsr == null ? "—" : `${(cash.dsr * 100).toFixed(1)}%`;
  const perPerson = person.householdSize > 0 ? cash.residual / person.householdSize : null;

  const patchTerms = (patch: Partial<LoanRecord>) => setTerms((current) => ({ ...current, ...patch }));

  return (
    <>
      <section className="inspector">
        <div className="identity">
          <div>
            <div className="section-label">
              <h2>{t(lang, "profile")}</h2>
            </div>
            <h3 className="who" data-testid="borrower-name">
              {name}
              {person.demo && <em className="demo-tag">{t(lang, "demo")}</em>}
            </h3>
            <p className="fine">{place}</p>
            <p className="fine">
              {person.occupation}
              {person.occupation && " · "}
              {person.householdSize} {t(lang, "household")}
              {person.phone && ` · ${person.phone}`}
            </p>
          </div>
          <button type="button" className="ghost" onClick={() => setEditing(true)}>
            {t(lang, "editProfile")}
          </button>
        </div>

        <div className="section-label">
          <h2>{t(lang, "method")}</h2>
        </div>
        <div className="segment" role="radiogroup" aria-label={t(lang, "method")}>
          <button type="button" role="radio" aria-checked={terms.method === "flat"} data-testid="method-flat" onClick={() => patchTerms({ method: "flat" })}>
            {t(lang, "flat")}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={terms.method === "declining"}
            data-testid="method-declining"
            onClick={() => patchTerms({ method: "declining" })}
          >
            {t(lang, "declining")}
          </button>
        </div>
        <div className="term-row">
          {TERMS.map((months) => (
            <button
              type="button"
              key={months}
              className={terms.termMonths === months ? "chip on" : "chip"}
              onClick={() => patchTerms({ termMonths: months })}
            >
              {months}
            </button>
          ))}
        </div>
        <div className="form-grid compact">
          <label>
            {t(lang, "principal")}
            <NumericField
              testId="principal"
              label={t(lang, "principal")}
              min={0}
              value={terms.principal}
              onChange={(principal) => patchTerms({ principal })}
            />
          </label>
          <label>
            {t(lang, "rate")}
            <NumericField testId="rate" label={t(lang, "rate")} min={0} max={200} value={terms.annualRate} onChange={(annualRate) => patchTerms({ annualRate })} />
          </label>
          <label>
            {t(lang, "term")}
            <NumericField
              label={t(lang, "term")}
              min={1}
              max={360}
              value={terms.termMonths}
              onChange={(termMonths) => patchTerms({ termMonths: Math.round(termMonths) })}
            />
          </label>
          <label>
            {t(lang, "currency")}
            <select
              data-testid="contract-currency"
              value={terms.currency}
              onChange={(event) => {
                const currency = event.target.value as Currency;
                patchTerms({ currency });
                setViewCurrency(currency);
              }}
            >
              <option value="KHR">{t(lang, "khr")}</option>
              <option value="USD">{t(lang, "usd")}</option>
            </select>
          </label>
          <label>
            {t(lang, "disbursement")}
            <input
              type="date"
              value={terms.disbursementDate}
              onChange={(event) => patchTerms({ disbursementDate: event.target.value })}
            />
          </label>
          <label>
            {t(lang, "exchange")}
            <NumericField
              testId="exchange-rate"
              label={t(lang, "exchange")}
              min={1}
              value={terms.khrPerUsd}
              onChange={(khrPerUsd) => patchTerms({ khrPerUsd })}
            />
          </label>
          <label className="span-2">
            {t(lang, "purpose")}
            <select
              value={terms.purpose}
              onChange={(event) => patchTerms({ purpose: event.target.value as LoanRecord["purpose"] })}
            >
              {LOAN_PURPOSES.map((purpose) => (
                <option key={purpose.id} value={purpose.id}>
                  {lang === "km" ? purpose.km : purpose.en}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={`dsr-card ${cash.band}`} data-testid="dsr-value" data-band={cash.band}>
          <div className="dsr-top">
            <span>{t(lang, "dsr")}</span>
            <strong>{dsrText}</strong>
            <em>{bandLabel(lang, cash.band)}</em>
          </div>
          <div className="meter" aria-hidden="true">
            <span className="tick" style={{ left: "40%" }} />
            <span className="tick" style={{ left: "50%" }} />
            <span className="tick" style={{ left: "70%" }} />
            <span className="meter-fill" style={{ width: `${Math.min(100, (cash.dsr ?? 0) * 100)}%` }} />
          </div>
          <dl className="dsr-figures">
            <div>
              <dt>{t(lang, "proposed")}</dt>
              <dd>{formatMoney(cash.proposed, person.householdCurrency)}</dd>
            </div>
            <div>
              <dt>{t(lang, "residual")}</dt>
              <dd className={cash.residual < 0 ? "neg" : undefined}>{formatMoney(cash.residual, person.householdCurrency)}</dd>
            </div>
            <div>
              <dt>{t(lang, "perPerson")}</dt>
              <dd>{perPerson == null ? "—" : formatMoney(perPerson, person.householdCurrency)}</dd>
            </div>
          </dl>
          <p className="fine">{cash.dsr == null ? t(lang, "needsIncome") : t(lang, "dsrHint")}</p>
        </div>

        <div className="section-row">
          <div className="section-label">
            <h2>{t(lang, "cashflow")}</h2>
          </div>
          <div className="segment" role="radiogroup" aria-label={t(lang, "householdCurrency")}>
            {(["KHR", "USD"] as const).map((currency) => (
              <button
                key={currency}
                type="button"
                role="radio"
                aria-checked={person.householdCurrency === currency}
                onClick={() => setPerson({ ...person, householdCurrency: currency })}
              >
                {currency === "KHR" ? t(lang, "khr") : t(lang, "usd")}
              </button>
            ))}
          </div>
        </div>
        <CashFlowEditor
          lang={lang}
          currency={person.householdCurrency}
          incomes={person.incomes}
          expenses={person.expenses}
          debts={person.existingDebts}
          onChange={(next) => setPerson({ ...person, ...next })}
        />

        <label className="visit">
          {t(lang, "visitNote")}
          <textarea
            rows={3}
            value={person.visitNote}
            onChange={(event) => setPerson({ ...person, visitNote: event.target.value })}
          />
        </label>

        <PhotoVault
          lang={lang}
          borrowerName={name}
          officer={officer}
          photos={photos}
          onAdd={async (photo) => {
            onAddPhoto({
              ...photo,
              id: photo.id ?? uid(),
              borrowerId: borrower.id,
              updatedAt: Date.now(),
              syncStatus: "pending",
            });
          }}
          onDelete={onDeletePhoto}
        />
      </section>
      {schedule.valid ? (
        <div className="sheet-wrap">
          <div className="stats">
            <article data-testid="installment">
              <span>{t(lang, "installment")}</span>
              <strong>{formatMoney(schedule.regularPayment, terms.currency)}</strong>
              {person.householdCurrency !== terms.currency && <small>{formatMoney(cash.proposed, person.householdCurrency)}</small>}
            </article>
            <article data-testid="total-interest">
              <span>{t(lang, "totalInterest")}</span>
              <strong>{formatMoney(schedule.totalInterest, terms.currency)}</strong>
            </article>
            <article>
              <span>{t(lang, "totalPayable")}</span>
              <strong>{formatMoney(schedule.totalPayable, terms.currency)}</strong>
            </article>
            <article data-testid="eir">
              <span>{t(lang, "eir")}</span>
              <strong>{formatPercent(schedule.effectiveAnnualRate)}</strong>
              <small>
                {t(lang, "nominal")} {terms.annualRate}% · {purposeLabel(terms.purpose, lang)}
              </small>
            </article>
          </div>
          <ScheduleTable
            lang={lang}
            schedule={schedule}
            other={other}
            viewCurrency={viewCurrency}
            contractCurrency={terms.currency}
            khrPerUsd={terms.khrPerUsd}
            borrowerName={name}
            onViewCurrency={setViewCurrency}
          />
        </div>
      ) : (
        <section className="sheet empty-sheet">
          <h2>{t(lang, "schedule")}</h2>
          <p>{t(lang, "emptyBody")}</p>
        </section>
      )}
      <BorrowerDialog
        open={editing}
        title={t(lang, "editProfile")}
        initial={person}
        lang={lang}
        allowDelete
        onClose={() => setEditing(false)}
        onSubmit={(next) => {
          setPerson(next);
          setEditing(false);
        }}
        onDelete={() => onDeleteBorrower(borrower.id)}
      />
    </>
  );
}
