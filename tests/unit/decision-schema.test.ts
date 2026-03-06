import { describe, it, expect } from "vitest";
import { createDecisionSchema } from "@/schemas/decision.schema";

describe("createDecisionSchema", () => {
  it("accepts missing name", () => {
    const parsed = createDecisionSchema.parse({
      template: "ONE_TIME_EXPENSE",
      inputs: { amount: 2500 },
    });

    expect(parsed.name).toBeUndefined();
    expect(parsed.inputs).toEqual({ amount: 2500 });
  });

  it("trims provided name", () => {
    const parsed = createDecisionSchema.parse({
      template: "ONE_TIME_EXPENSE",
      name: "  Emergency plumbing  ",
      inputs: { amount: 2500 },
    });

    expect(parsed.name).toBe("Emergency plumbing");
  });
});
