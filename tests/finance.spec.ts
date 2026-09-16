import { expect, test } from "@playwright/test";
import { getSnapshot } from "../src/lib/finance";
import { buildScenario, scenarioList } from "../src/mocks/scenarios";
import { simulatePurchase } from "../src/features/simulator/simulate";

test.describe("QA-01 · modelo financiero", () => {
  test("el monto gastable nunca supera el saldo operativo", () => {
    for (const scenario of scenarioList) {
      const snapshot = getSnapshot(buildScenario(scenario.id));
      expect(snapshot.spendableToday).toBeGreaterThanOrEqual(0);
      expect(snapshot.spendableToday).toBeLessThanOrEqual(snapshot.operating);
    }
  });

  test("resta reservas, compromisos y colchon una sola vez", () => {
    const tight = getSnapshot(buildScenario("tight"));
    expect(tight.free).toBe(tight.operating - tight.reserved - tight.committed - tight.cushion);
    expect(tight.reserved).toBe(600);
    expect(tight.committed).toBe(0);
    expect(tight.cushion).toBe(1000);
    expect(tight.free).toBe(1482.21);

    const risk = getSnapshot(buildScenario("risk"));
    expect(risk.committed).toBe(700);
    expect(risk.free).toBeCloseTo(risk.operating - risk.reserved - risk.committed - risk.cushion, 2);
  });
});

test.describe("QA-01 · simulador", () => {
  test("produce Seguro, Ajustado y No recomendado con las reglas centrales", () => {
    const comfortableState = buildScenario("comfortable");
    const tightState = buildScenario("tight");

    expect(
      simulatePurchase(comfortableState, getSnapshot(comfortableState), {
        amountNio: 100,
        accountId: "acc-banpro",
      }).outcome,
    ).toBe("safe");
    expect(
      simulatePurchase(tightState, getSnapshot(tightState), {
        amountNio: 100,
        accountId: "acc-banpro",
      }).outcome,
    ).toBe("tight");
    expect(
      simulatePurchase(tightState, getSnapshot(tightState), {
        amountNio: 2000,
        accountId: "acc-banpro",
      }).outcome,
    ).toBe("not-recommended");
  });
});
