import { expect, test } from "@playwright/test";
import { financialEngineParity } from "../src/lib/financial-engine-adapter";
import { buildScenario, scenarioList } from "../src/mocks/scenarios";

test.describe("FinancialEngine adapter", () => {
  test("preserves core balances and projections for every legacy scenario", () => {
    for (const scenario of scenarioList) {
      expect(financialEngineParity(buildScenario(scenario.id)), scenario.id).toEqual({
        operating: true,
        reserved: true,
        committed: true,
        free: true,
        projectionBeforePace: true,
      });
    }
  });
});
