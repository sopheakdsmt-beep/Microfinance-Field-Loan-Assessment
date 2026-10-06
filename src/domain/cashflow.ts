import { convertAmount, type Currency } from "./money";

export interface CashLine {
  id: string;
  label: string;
  amount: number;
}

export interface ExistingDebt {
  id: string;
  lender: string;
  monthlyPayment: number;
  balance: number;
}

export type DsrBand = "comfortable" | "acceptable" | "caution" | "exceeds" | "unknown";

export interface CashFlowSummary {
  income: number;
  living: number;
  existingDebt: number;
  disposable: number;
  proposed: number;
  totalDebt: number;
  residual: number;
  /** Total monthly debt service divided by household income. Null when income is 0. */
  dsr: number | null;
  band: DsrBand;
}

export function sumAmounts(lines: { amount: number }[]): number {
  return lines.reduce((sum, line) => sum + (Number.isFinite(line.amount) ? line.amount : 0), 0);
}

/**
 * Debt-service ratio uses household income as the denominator and adds the
 * new installment, converted into the currency the family actually earns.
 * Living costs stay out of the ratio so an existing food budget is not
 * mistaken for a loan payment. Residual cash still subtracts both.
 */
export function summarizeCashFlow(input: {
  incomes: CashLine[];
  expenses: CashLine[];
  debts: ExistingDebt[];
  proposedInstallment: number;
  loanCurrency: Currency;
  householdCurrency: Currency;
  khrPerUsd: number;
}): CashFlowSummary {
  const income = sumAmounts(input.incomes);
  const living = sumAmounts(input.expenses);
  const existingDebt = sumAmounts(
    input.debts.map((debt) => ({ amount: debt.monthlyPayment })),
  );
  const proposed = convertAmount(
    input.proposedInstallment,
    input.loanCurrency,
    input.householdCurrency,
    input.khrPerUsd,
  );
  const disposable = income - living;
  const totalDebt = existingDebt + proposed;
  const residual = disposable - totalDebt;
  const dsr = income > 0 ? totalDebt / income : null;
  return {
    income,
    living,
    existingDebt,
    disposable,
    proposed,
    totalDebt,
    residual,
    dsr,
    band: dsrBand(dsr),
  };
}

/**
 * Field guideposts used on the visit, not a credit decision.
 * At or under 40% is comfortable, 50% is the usual review line,
 * and 70% is the upper band many microfinance files will not pass.
 */
export function dsrBand(dsr: number | null): DsrBand {
  if (dsr == null || !Number.isFinite(dsr)) return "unknown";
  if (dsr <= 0.4) return "comfortable";
  if (dsr <= 0.5) return "acceptable";
  if (dsr <= 0.7) return "caution";
  return "exceeds";
}
