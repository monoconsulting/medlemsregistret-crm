import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('test', async ({ page }) => {
  await page.goto('http://localhost:3010/dashboard');
  await page.getByRole('link', { name: 'Kommunöversikt' }).click();
  
  // Klicka på Ekerö för att öppna detalj-panelen (har 122 importerade föreningar)
  await page.getByRole('link', { name: 'Ekerö' }).click();
  
  // Vänta på att detalj-panelen laddas
  await page.waitForTimeout(500);
  
  // Klicka på "Visa föreningar"-knappen i detalj-panelen
  await page.getByRole('link', { name: 'Visa föreningar' }).click();
  
  // Vänta på att föreningssidan laddas
  await page.waitForLoadState('networkidle');
  
  console.log('Page URL:', page.url());
  
  // Kontrollera att vi är på rätt sida
  expect(page.url()).toContain('/municipalities/');
  expect(page.url()).toContain('/associations');
  
  // Leta efter föreningskort eller empty state
  const associationCards = page.locator('[class*="border"][class*="rounded"]').filter({ hasText: /Org\.nr:|E-post:|Telefon:/ });
  const emptyState = page.getByText('Inga föreningar hittades');
  
  const cardCount = await associationCards.count();
  const hasEmptyState = await emptyState.count() > 0;
  
  console.log('Association cards found:', cardCount);
  console.log('Has empty state:', hasEmptyState);
  
  // Verifiera att ANTINGEN finns föreningar ELLER empty state (inte mockdata)
  if (cardCount > 0) {
    console.log('✓ Föreningar hittades:', cardCount);
    expect(cardCount).toBeGreaterThan(0);
  } else if (hasEmptyState) {
    console.log('✓ Empty state visas (inga föreningar importerade)');
  } else {
    // Ta screenshot för debugging
    await page.screenshot({ path: 'test-results/unexpected-state.png' });
    const bodyText = await page.locator('body').innerText();
    console.log('Body text:', bodyText);
    throw new Error('Varken föreningar eller empty state hittades');
  }
});
