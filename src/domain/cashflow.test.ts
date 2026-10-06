import { describe, expect, it } from "vitest";
import { dsrBand, summarizeCashFlow } from "./cashflow";

describe("household cash flow", () => {
  it("computes debt service against income and leaves living costs in the residual", () => {
    const summary = summarizeCashFlow({
      incomes: [
        { id: "a", label: "rice", amount: 1_200_000 },
        { id: "b", label: "pigs", amount: 300_000 },
      ],
      expenses: [{ id: "c", label: "food", amount: 800_000 }],
      debts: [{ id: "d", lender: "village", monthlyPayment: 100_000, balance: 400_000 }],
      proposedInstallment: 200_000,
      loanCurrency: "KHR",
      householdCurrency: "KHR",
      khrPerUsd: 4100,
    });
    expect(summary.income).toBe(1_500_000);
    expect(summary.totalDebt).toBe(300_000);
    expect(summary.dsr).toBeCloseTo(0.2, 5);
    expect(summary.residual).toBe(400_000);
    expect(summary.band).toBe("comfortable");
  });

  it("converts a dollar installment into riel income before the ratio", () => {
    const summary = summarizeCashFlow({
      incomes: [{ id: "a", label: "sales", amount: 1_200_000 }],
      expenses: [],
      debts: [],
      proposedInstallment: 68,
      loanCurrency: "USD",
      householdCurrency: "KHR",
      khrPerUsd: 4100,
    });
    expect(summary.proposed).toBe(278_800);
    expect(summary.dsr).toBeCloseTo(278_800 / 1_200_000, 5);
  });

  it("does not invent a ratio when the household income is still blank", () => {
    const summary = summarizeCashFlow({
      incomes: [],
      expenses: [],
      debts: [],
      proposedInstallment: 50,
      loanCurrency: "USD",
      householdCurrency: "USD",
      khrPerUsd: 4100,
    });
    expect(summary.dsr).toBeNull();
    expect(summary.band).toBe("unknown");
  });
});

describe("dsr bands", () => {
  it("marks the field guideposts", () => {
    expect(dsrBand(0.4)).toBe("comfortable");
    expect(dsrBand(0.5)).toBe("acceptable");
    expect(dsrBand(0.62)).toBe("caution");
    expect(dsrBand(0.71)).toBe("exceeds");
  });
});
