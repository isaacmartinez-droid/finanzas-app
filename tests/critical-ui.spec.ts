import { expect, test } from "@playwright/test";

test.describe("QA-01 · Dashboard", () => {
  test("muestra el hero y explica la cifra sin navegar", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator('section[aria-labelledby="hero-title"]');
    await expect(page.getByRole("heading", { name: "Puedes gastar hoy" })).toBeVisible();
    await expect(hero.locator(".hero-amount .money-real")).toHaveText("C$1,482.21");

    await hero.getByRole("button", { name: /Ver c.lculo/ }).click();
    await expect(hero.getByText("Saldo operativo", { exact: true }).last()).toBeVisible();
    await expect(hero.getByText(/^Colch.n$/).last()).toBeVisible();
    await expect(hero.getByText("Dinero libre hoy", { exact: true })).toBeVisible();
    await expect(hero.locator(".money-real").filter({ hasText: "C$1,482.21" })).toHaveCount(2);
  });

  test("la privacidad oculta tambien el calculo", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator('section[aria-labelledby="hero-title"]');
    await hero.getByRole("button", { name: /Ver c.lculo/ }).click();
    await page.getByRole("button", { name: "Ocultar montos" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-privacy", "on");
    await expect(hero.locator(".hero-amount .money-real")).toBeHidden();
    await expect(hero.locator(".hero-amount .money-masked")).toBeVisible();
    await expect(hero.getByText("Monto oculto").first()).toBeAttached();
  });
});

test.describe("QA-01 · Quick Add", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("abre, cierra con Escape y devuelve el foco", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Registrar o simular" });

    await trigger.click();
    await expect(page.getByRole("dialog", { name: /quieres hacer/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: /quieres hacer/ })).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await page.getByRole("button", { name: "Cerrar" }).click();
    await expect(page.getByRole("dialog", { name: /quieres hacer/ })).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test("QA-01 · no hay desborde horizontal en anchos criticos", async ({ page }) => {
  const viewports = [
    { width: 320, height: 720 },
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1366, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Puedes gastar hoy" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth, `${viewport.width}px`).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
