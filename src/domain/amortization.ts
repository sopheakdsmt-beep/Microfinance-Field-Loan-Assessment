import { addMonths } from "./dates";
import {
  type Currency,
  fromMinor,
  roundMinor,
  toMinor,
} from "./money";

export type RepaymentMethod = "flat" | "declining";

export interface ScheduleInput {
  principal: number;
  annualRate: number;
  termMonths: number;
  method: RepaymentMethod;
  currency: Currency;
  disbursementDate: string;
}

export interface ScheduleRow {
  period: number;
  dueDate: string;
  principal: number;
  interest: number;
  payment: number;
  balance: number;
}

export interface Schedule {
  valid: boolean;
  method: RepaymentMethod;
  currency: Currency;
  principal: number;
  annualRate: number;
  termMonths: number;
  rows: ScheduleRow[];
  totalPrincipal: number;
  totalInterest: number;
  totalPayable: number;
  /** Equal installment, or the first installment when the last row absorbs rounding. */
  regularPayment: number;
  /** (1 + monthly IRR) ^ 12 - 1, from the rounded schedule. */
  effectiveAnnualRate: number | null;
}

const EMPTY: Schedule = {
  valid: false,
  method: "flat",
  currency: "KHR",
  principal: 0,
  annualRate: 0,
  termMonths: 0,
  rows: [],
  totalPrincipal: 0,
  totalInterest: 0,
  totalPayable: 0,
  regularPayment: 0,
  effectiveAnnualRate: null,
};

/**
 * Flat rate, as quoted by most Cambodian microfinance contracts:
 * each month's interest is principal × annual rate / 12, and principal is
 * spread evenly. The nominal annual rate is not an effective rate.
 *
 * Declining balance is an annuity: a level installment, with interest each
 * month charged only on the outstanding principal.
 *
 * Money moves in integer minor units so the principal column sums back to
 * the amount disbursed after teller rounding.
 */
export function buildSchedule(input: ScheduleInput): Schedule {
  const term = Math.floor(input.termMonths);
  if (!(input.principal > 0) || !(term >= 1) || term > 360) return { ...EMPTY, method: input.method, currency: input.currency };
  if (!(input.annualRate >= 0) || input.annualRate > 200 || !Number.isFinite(input.annualRate)) {
    return { ...EMPTY, method: input.method, currency: input.currency };
  }

  const currency = input.currency;
  const principalMinor = toMinor(input.principal, currency);
  const monthlyRate = input.annualRate / 100 / 12;
  const rowsMinor =
    input.method === "flat"
      ? flatRows(principalMinor, monthlyRate, term, currency)
      : decliningRows(principalMinor, monthlyRate, term, currency);

  const rows: ScheduleRow[] = rowsMinor.map((row, index) => ({
    period: index + 1,
    dueDate: addMonths(input.disbursementDate, index + 1),
    principal: fromMinor(row.principal, currency),
    interest: fromMinor(row.interest, currency),
    payment: fromMinor(row.principal + row.interest, currency),
    balance: fromMinor(row.balance, currency),
  }));

  const totalPrincipal = fromMinor(
    rowsMinor.reduce((sum, row) => sum + row.principal, 0),
    currency,
  );
  const totalInterest = fromMinor(
    rowsMinor.reduce((sum, row) => sum + row.interest, 0),
    currency,
  );

  return {
    valid: true,
    method: input.method,
    currency,
    principal: fromMinor(principalMinor, currency),
    annualRate: input.annualRate,
    termMonths: term,
    rows,
    totalPrincipal,
    totalInterest,
    totalPayable: fromMinor(
      rowsMinor.reduce((sum, row) => sum + row.principal + row.interest, 0),
      currency,
    ),
    regularPayment: rows[0]?.payment ?? 0,
    effectiveAnnualRate: effectiveAnnualRate(
      fromMinor(principalMinor, currency),
      rows.map((row) => row.payment),
    ),
  };
}

interface MinorRow {
  principal: number;
  interest: number;
  balance: number;
}

function flatRows(
  principalMinor: number,
  monthlyRate: number,
  term: number,
  currency: Currency,
): MinorRow[] {
  const interest = roundMinor(principalMinor * monthlyRate, currency);
  const evenPrincipal = roundMinor(principalMinor / term, currency);
  let balance = principalMinor;
  const rows: MinorRow[] = [];
  for (let period = 1; period <= term; period += 1) {
    const principal =
      period === term ? balance : Math.min(evenPrincipal, balance);
    balance -= principal;
    rows.push({ principal, interest, balance });
  }
  return rows;
}

function decliningRows(
  principalMinor: number,
  monthlyRate: number,
  term: number,
  currency: Currency,
): MinorRow[] {
  let payment: number;
  if (monthlyRate === 0) {
    payment = roundMinor(principalMinor / term, currency);
  } else {
    const growth = (1 + monthlyRate) ** term;
    const raw = (principalMinor * monthlyRate * growth) / (growth - 1);
    payment = roundMinor(raw, currency);
    const firstInterest = roundMinor(principalMinor * monthlyRate, currency);
    if (payment <= firstInterest) {
      payment = firstInterest + Math.max(1, roundMinor(principalMinor / term, currency));
    }
  }

  let balance = principalMinor;
  const rows: MinorRow[] = [];
  for (let period = 1; period < term; period += 1) {
    const interest = roundMinor(balance * monthlyRate, currency);
    let principal = payment - interest;
    if (principal < 0) principal = 0;
    if (principal > balance) principal = balance;
    balance -= principal;
    rows.push({ principal, interest, balance });
  }
  const interest = roundMinor(balance * monthlyRate, currency);
  rows.push({ principal: balance, interest, balance: 0 });
  return rows;
}

/** Lender IRR: cash out the principal, cash in each installment. */
export function effectiveAnnualRate(
  principal: number,
  payments: number[],
): number | null {
  if (!(principal > 0) || payments.length === 0) return null;
  if (payments.every((payment) => payment === 0)) return 0;
  let rate = 0.01;
  for (let iteration = 0; iteration < 60; iteration += 1) {
    let npv = -principal;
    let derivative = 0;
    for (let t = 1; t <= payments.length; t += 1) {
      const discount = (1 + rate) ** t;
      npv += payments[t - 1] / discount;
      derivative += (-t * payments[t - 1]) / (1 + rate) ** (t + 1);
    }
    if (!Number.isFinite(npv) || !Number.isFinite(derivative) || Math.abs(derivative) < 1e-14) {
      return null;
    }
    const next = rate - npv / derivative;
    if (!Number.isFinite(next) || next <= -0.99) return null;
    if (Math.abs(next - rate) < 1e-12) {
      rate = next;
      break;
    }
    rate = next;
  }
  if (rate <= -0.99) return null;
  const annual = (1 + rate) ** 12 - 1;
  return Number.isFinite(annual) ? annual : null;
}

export function formatPercent(rate: number | null, digits = 2): string {
  if (rate == null || !Number.isFinite(rate)) return "—";
  return `${(rate * 100).toFixed(digits)}%`;
}
