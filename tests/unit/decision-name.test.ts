import { describe, it, expect } from "vitest";
import { buildDecisionName } from "@/lib/decision-name";

describe("buildDecisionName", () => {
  it("includes template label and key numeric detail", () => {
    const name = buildDecisionName("ONE_TIME_EXPENSE", { amount: 12345 });
    expect(name).toBe("One-time expense: $12,345");
  });

  it("includes descriptive text when present", () => {
    const name = buildDecisionName("NEW_LOAN", {
      loanAmount: 50000,
      purpose: "Car replacement",
    });
    expect(name).toBe("Take a loan: $50,000 (Car replacement)");
  });

  it("falls back to date suffix when no useful fields exist", () => {
    const now = new Date("2026-03-06T10:30:00.000Z");
    const name = buildDecisionName("RECURRING_EXPENSE", {}, now);
    expect(name).toBe("Recurring expense (2026-03-06)");
  });
});
