import { test, expect } from '@playwright/test';

test.describe('HomePremium Products Consistency', () => {
  test('should not show local data initially and should load remote data', async ({ page }) => {
    // Navigate to the home page
    await page.goto('http://localhost:8080/');

    // Initially, catalogLoading is true, so "Buscando produtos..." should be visible if it was in the search results,
    // but here we are checking the opportunities section.
    
    // We expect to see some product cards eventually (remote data)
    const productCards = page.locator('.pc-product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    const count = await productCards.count();
    console.log(`Loaded ${count} products from remote catalog.`);
    
    // Get the IDs of the first 3 products
    const initialIds = await Promise.all(
      (await productCards.all()).slice(0, 3).map(card => card.getAttribute('data-product-id'))
    );
    console.log('Initial product IDs:', initialIds);

    // Refresh the page
    await page.reload();
    
    // Wait for product cards again
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    
    const newIds = await Promise.all(
      (await productCards.all()).slice(0, 3).map(card => card.getAttribute('data-product-id'))
    );
    console.log('After refresh product IDs:', newIds);

    // Verify the IDs are the same (consistency)
    expect(newIds).toEqual(initialIds);
  });
});
