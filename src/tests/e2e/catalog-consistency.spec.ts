import { test, expect, type Page } from "@playwright/test";

async function readProductIds(page: Page) {
  const cards = page.locator(".pc-product-card");
  await expect(cards.first()).toBeVisible({ timeout: 20000 });
  await expect.poll(async () => cards.count(), { timeout: 20000 }).toBeGreaterThan(1);
  return cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-product-id")));
}

test.describe("Consistência do catálogo na home", () => {
  test("a lista, a ordenação e os IDs não mudam entre recarregamentos", async ({ page }) => {
    await page.goto("/");
    const first = await readProductIds(page);
    expect(first.length).toBeGreaterThan(1);
    expect(first).not.toContain(null);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.reload();
      const next = await readProductIds(page);
      expect(next).toEqual(first);
    }
  });

  test("a lista permanece idêntica após navegar e voltar", async ({ page }) => {
    await page.goto("/");
    const first = await readProductIds(page);

    await page.goto("/buscar");
    await page.goto("/");
    expect(await readProductIds(page)).toEqual(first);

    await page.goBack();
    await page.goForward();
    expect(await readProductIds(page)).toEqual(first);
  });

  test("as lojas exibidas mantêm a mesma ordem entre recarregamentos", async ({ page }) => {
    await page.goto("/");
    const storeIds = page.locator(".pc-store-card");
    await expect(storeIds.first()).toBeVisible({ timeout: 20000 });
    const before = await storeIds.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-store-id")));

    await page.reload();
    await expect(storeIds.first()).toBeVisible({ timeout: 20000 });
    const after = await storeIds.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-store-id")));

    expect(after).toEqual(before);
  });
});
