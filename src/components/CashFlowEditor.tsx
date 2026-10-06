import type { CashLine, ExistingDebt } from "../domain/cashflow";
import type { Currency } from "../domain/money";
import type { Lang } from "../db/types";
import { uid } from "../db/db";
import { t } from "../i18n";
import { NumericField } from "./NumericField";

export function CashFlowEditor({
  lang,
  currency,
  incomes,
  expenses,
  debts,
  onChange,
}: {
  lang: Lang;
  currency: Currency;
  incomes: CashLine[];
  expenses: CashLine[];
  debts: ExistingDebt[];
  onChange: (next: { incomes: CashLine[]; expenses: CashLine[]; debts: ExistingDebt[] }) => void;
}) {
  const unit = currency === "KHR" ? "៛" : "$";
  const updateLine = (kind: "incomes" | "expenses", id: string, patch: Partial<CashLine>) => {
    const list = kind === "incomes" ? incomes : expenses;
    const next = list.map((line) => (line.id === id ? { ...line, ...patch } : line));
    onChange(kind === "incomes" ? { incomes: next, expenses, debts } : { incomes, expenses: next, debts });
  };

  return (
    <div className="cashflow">
      <p className="fine">{t(lang, "expenseHint")}</p>
      <LineGroup
        lang={lang}
        title={`${t(lang, "income")} · ${unit}`}
        lines={incomes}
        currency={currency}
        onLabel={(id, label) => updateLine("incomes", id, { label })}
        onAmount={(id, amount) => updateLine("incomes", id, { amount })}
        onRemove={(id) => onChange({ incomes: incomes.filter((line) => line.id !== id), expenses, debts })}
        onAdd={() => onChange({ incomes: [...incomes, { id: uid(), label: "", amount: 0 }], expenses, debts })}
      />
      <LineGroup
        lang={lang}
        title={`${t(lang, "expense")} · ${unit}`}
        lines={expenses}
        currency={currency}
        onLabel={(id, label) => updateLine("expenses", id, { label })}
        onAmount={(id, amount) => updateLine("expenses", id, { amount })}
        onRemove={(id) => onChange({ incomes, expenses: expenses.filter((line) => line.id !== id), debts })}
        onAdd={() => onChange({ incomes, expenses: [...expenses, { id: uid(), label: "", amount: 0 }], debts })}
      />
      <div className="line-group">
        <div className="line-head">
          <h3>{t(lang, "existingDebt")}</h3>
          <button
            type="button"
            className="ghost tiny"
            onClick={() =>
              onChange({
                incomes,
                expenses,
                debts: [...debts, { id: uid(), lender: "", monthlyPayment: 0, balance: 0 }],
              })
            }
          >
            {t(lang, "addLine")}
          </button>
        </div>
        {debts.map((debt) => (
          <div className="debt-row" key={debt.id}>
            <input
              aria-label={t(lang, "lender")}
              placeholder={t(lang, "lender")}
              value={debt.lender}
              onChange={(event) =>
                onChange({
                  incomes,
                  expenses,
                  debts: debts.map((item) => (item.id === debt.id ? { ...item, lender: event.target.value } : item)),
                })
              }
            />
            <NumericField
              label={t(lang, "monthly")}
              min={0}
              value={debt.monthlyPayment}
              onChange={(amount) =>
                onChange({
                  incomes,
                  expenses,
                  debts: debts.map((item) => (item.id === debt.id ? { ...item, monthlyPayment: amount } : item)),
                })
              }
            />
            <NumericField
              label={t(lang, "outstanding")}
              min={0}
              value={debt.balance}
              onChange={(amount) =>
                onChange({
                  incomes,
                  expenses,
                  debts: debts.map((item) => (item.id === debt.id ? { ...item, balance: amount } : item)),
                })
              }
            />
            <button
              type="button"
              className="ghost tiny"
              onClick={() => onChange({ incomes, expenses, debts: debts.filter((item) => item.id !== debt.id) })}
            >
              {t(lang, "remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineGroup({
  lang,
  title,
  lines,
  onLabel,
  onAmount,
  onRemove,
  onAdd,
}: {
  lang: Lang;
  title: string;
  lines: CashLine[];
  currency: Currency;
  onLabel: (id: string, label: string) => void;
  onAmount: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="line-group">
      <div className="line-head">
        <h3>{title}</h3>
        <button type="button" className="ghost tiny" onClick={onAdd}>
          {t(lang, "addLine")}
        </button>
      </div>
      {lines.map((line) => (
        <div className="line-row" key={line.id}>
          <input
            aria-label={title}
            placeholder={t(lang, "labelPlaceholder")}
            value={line.label}
            onChange={(event) => onLabel(line.id, event.target.value)}
          />
          <NumericField label={title} min={0} value={line.amount} onChange={(amount) => onAmount(line.id, amount)} />
          <button type="button" className="ghost tiny" onClick={() => onRemove(line.id)}>
            {t(lang, "remove")}
          </button>
        </div>
      ))}
    </div>
  );
}
