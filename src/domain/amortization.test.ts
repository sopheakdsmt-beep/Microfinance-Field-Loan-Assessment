import { describe, expect, it } from "vitest";
import { addMonths } from "./dates";
import { buildSchedule, effectiveAnnualRate } from "./amortization";
import { toMinor } from "./money";

function units(amount: number, currency: "USD" | "KHR") {
  return toMinor(amount, currency);
}

describe("addMonths", () => {
  it("keeps the day of month and clamps month ends", () => {
    expect(addMonths("2026-10-06", 1)).toBe("2026-11-06");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-11-30", 3)).toBe("2027-02-28");
  });
});

describe("flat rate schedule", () => {
  const schedule = buildSchedule({
    principal: 1000,
    annualRate: 18,
    termMonths: 24,
    method: "flat",
    currency: "USD",
    disbursementDate: "2026-10-06",
  });

  it("charges interest on the original principal every month", () => {
    expect(schedule.valid).toBe(true);
    expect(schedule.rows).toHaveLength(24);
    expect(schedule.rows[0].dueDate).toBe("2026-11-06");
    expect(units(schedule.rows[0].interest, "USD")).toBe(1500);
    expect(units(schedule.rows[0].principal, "USD")).toBe(4167);
    expect(units(schedule.rows[0].payment, "USD")).toBe(5667);
    expect(schedule.rows.every((row) => units(row.interest, "USD") === 1500)).toBe(true);
  });

  it("returns the full principal and lands on a zero balance", () => {
    const principal = schedule.rows.reduce((sum, row) => sum + units(row.principal, "USD"), 0);
    expect(principal).toBe(100000);
    expect(units(schedule.totalInterest, "USD")).toBe(36000);
    expect(schedule.rows[23].balance).toBe(0);
    expect(units(schedule.rows[23].principal, "USD")).toBe(100000 - 4167 * 23);
  });
});

describe("declining balance schedule", () => {
  const schedule = buildSchedule({
    principal: 1000,
    annualRate: 18,
    termMonths: 24,
    method: "declining",
    currency: "USD",
    disbursementDate: "2026-10-06",
  });

  it("charges the first month of interest on the full balance", () => {
    expect(units(schedule.rows[0].interest, "USD")).toBe(1500);
    expect(schedule.rows[0].payment).toBe(schedule.regularPayment);
  });

  it("keeps a level payment until the rounding row and ends at zero", () => {
    const typical = units(schedule.rows[0].payment, "USD");
    schedule.rows.slice(0, -1).forEach((row) => {
      expect(units(row.payment, "USD")).toBe(typical);
    });
    const principal = schedule.rows.reduce((sum, row) => sum + units(row.principal, "USD"), 0);
    expect(principal).toBe(100000);
    expect(schedule.rows[23].balance).toBe(0);
    expect(schedule.totalInterest).toBeLessThan(360);
  });

  it("reduces interest as the balance falls", () => {
    const first = units(schedule.rows[0].interest, "USD");
    const last = units(schedule.rows[23].interest, "USD");
    expect(last).toBeLessThan(first);
  });
});

describe("riel rounding", () => {
  it("rounds the flat installment to the nearest 100 riel and still repays principal", () => {
    const schedule = buildSchedule({
      principal: 8_000_000,
      annualRate: 18,
      termMonths: 12,
      method: "flat",
      currency: "KHR",
      disbursementDate: "2026-10-06",
    });
    expect(units(schedule.rows[0].interest, "KHR")).toBe(120_000);
    expect(units(schedule.rows[0].principal, "KHR")).toBe(666_700);
    const principal = schedule.rows.reduce((sum, row) => sum + units(row.principal, "KHR"), 0);
    expect(principal).toBe(8_000_000);
    expect(schedule.rows[11].balance).toBe(0);
  });
});

describe("edges", () => {
  it("handles a zero interest rate without dividing by zero", () => {
    const schedule = buildSchedule({
      principal: 1200,
      annualRate: 0,
      termMonths: 12,
      method: "declining",
      currency: "USD",
      disbursementDate: "2026-10-06",
    });
    expect(schedule.rows.every((row) => row.interest === 0)).toBe(true);
    const principal = schedule.rows.reduce((sum, row) => sum + units(row.principal, "USD"), 0);
    expect(principal).toBe(120000);
    expect(schedule.effectiveAnnualRate).toBe(0);
  });

  it("rejects an empty principal", () => {
    expect(
      buildSchedule({
        principal: 0,
        annualRate: 18,
        termMonths: 12,
        method: "flat",
        currency: "USD",
        disbursementDate: "2026-10-06",
      }).valid,
    ).toBe(false);
  });
});

describe("effective annual rate", () => {
  it("prices a flat contract above its nominal rate and a declining contract near the compound rate", () => {
    const flat = buildSchedule({
      principal: 1000,
      annualRate: 18,
      termMonths: 24,
      method: "flat",
      currency: "USD",
      disbursementDate: "2026-10-06",
    });
    const declining = buildSchedule({
      principal: 1000,
      annualRate: 18,
      termMonths: 24,
      method: "declining",
      currency: "USD",
      disbursementDate: "2026-10-06",
    });
    expect(flat.effectiveAnnualRate).not.toBeNull();
    expect(declining.effectiveAnnualRate).not.toBeNull();
    expect(flat.effectiveAnnualRate!).toBeGreaterThan(0.18);
    expect(flat.effectiveAnnualRate!).toBeGreaterThan(declining.effectiveAnnualRate!);
    const compound = (1.015) ** 12 - 1;
    expect(Math.abs(declining.effectiveAnnualRate! - compound)).toBeLessThan(0.004);
  });

  it("solves a one-period loan directly", () => {
    const rate = effectiveAnnualRate(100, [110]);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo((1.1) ** 12 - 1, 6);
  });
});
