import { expect, test } from "@playwright/test";

test.describe("PLAN-01 - administracion MVP", () => {
  test("permite editar y liberar una reserva", async ({ page }) => {
    await page.goto("/plan");
    await page.getByRole("button", { name: /Administrar reserva/ }).click();
    await expect(page.getByRole("dialog", { name: "Detalle de la reserva" })).toBeVisible();

    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Monto reservado").fill("650");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("dialog", { name: "Detalle de la reserva" }).getByText("C$650.00").first()).toBeVisible();

    await page.getByRole("button", { name: "Liberar reserva" }).click();
    await expect(page.getByRole("dialog", { name: "Detalle de la reserva" })).toBeHidden();
    await expect(page.getByText(/Todav.a no tienes reservas/)).toBeVisible();
  });

  test("crea y elimina un presupuesto por categoria", async ({ page }) => {
    await page.goto("/plan");
    await page.getByRole("tab", { name: "Presupuestos" }).click();
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    await page.getByLabel(/L.mite del ciclo/).fill("1200");
    await page.getByRole("dialog", { name: "Crear presupuesto" }).getByRole("button", { name: "Crear presupuesto" }).click();

    const budget = page.getByRole("button", { name: /Editar presupuesto de/ });
    await expect(budget).toBeVisible();
    await budget.click();
    await page.getByRole("button", { name: "Eliminar presupuesto" }).click();
    await expect(page.getByText(/Todav.a no tienes presupuestos/)).toBeVisible();
  });

  test("pausa una recurrencia y la saca de la proyeccion", async ({ page }) => {
    await page.goto("/plan");
    await page.getByRole("tab", { name: "Recurrencias" }).click();
    await page.getByRole("button", { name: "Administrar recurrencia Comida" }).click();
    await expect(page.getByRole("dialog", { name: "Administrar recurrencia" })).toBeVisible();
    await page.getByRole("button", { name: "Pausar recurrencia" }).click();
    await expect(page.getByRole("button", { name: "Administrar recurrencia Comida" }).getByText("Pausada")).toBeVisible();
  });
});
