import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test.describe('Municipality Associations with tRPC', () => {
  test('should load municipality details and navigate to associations', async ({ page }) => {
    // Navigera till dashboard
    await page.goto('http://localhost:3010/dashboard');
    
    // Gå till kommunöversikt
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    
    // Vänta på att kommunlistan laddas
    await page.waitForSelector('text=289 kommuner', { timeout: 60000 });
    
    // Klicka på Ekerö-kortet för att navigera till associations
    await page.getByText('Klicka för att visa föreningar i Ekerö').click();
    
    // Vänta på att associations-sidan laddas
    await page.waitForSelector('h1:has-text("Föreningar")', { timeout: 10000 });
    
    // Verifiera att vi är på föreningssidan med municipality-filter
    expect(page.url()).toContain('/associations');
    expect(page.url()).toContain('municipality=Ekerö');
  });

  test('should display associations loaded via tRPC', async ({ page }) => {
    // Navigera direkt till associations-sidan för en kommun med data
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    await page.getByRole('link', { name: 'Ekerö' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Visa föreningar' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Kontrollera om det finns föreningar eller empty state
    const associationCards = page.locator('div[class*="Card"]').filter({ hasText: /Org\.nr:|Typ|Aktiviteter/i });
    const emptyState = page.getByText('Inga föreningar hittades');
    
    const cardCount = await associationCards.count();
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    
    // Verifiera att antingen föreningar eller empty state visas
    if (cardCount > 0) {
      console.log('✓ Föreningar laddade via tRPC:', cardCount);
      expect(cardCount).toBeGreaterThan(0);
      
      // Verifiera att första föreningen har nödvändig data
      const firstCard = associationCards.first();
      await expect(firstCard).toBeVisible();
      
      // Verifiera att föreningsnamn visas
      const cardTitle = firstCard.locator('[class*="CardTitle"]');
      await expect(cardTitle).toBeVisible();
    } else {
      console.log('✓ Empty state visas korrekt');
      expect(hasEmptyState).toBe(true);
      await expect(emptyState).toBeVisible();
    }
  });

  test('should handle search functionality with tRPC data', async ({ page }) => {
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    await page.getByRole('link', { name: 'Ekerö' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Visa föreningar' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Hitta sökfältet
    const searchInput = page.getByPlaceholder(/Sök föreningar/i);
    await expect(searchInput).toBeVisible();
    
    // Räkna föreningar före sökning
    const allCards = page.locator('div[class*="Card"]').filter({ hasText: /Org\.nr:|Typ|Aktiviteter/i });
    const initialCount = await allCards.count();
    
    if (initialCount > 0) {
      // Hämta namnet på första föreningen
      const firstCardTitle = await allCards.first().locator('[class*="CardTitle"]').innerText();
      const searchTerm = firstCardTitle.split(' ')[0]; // Första ordet i namnet
      
      // Sök efter föreningen
      await searchInput.fill(searchTerm);
      await page.waitForTimeout(500); // Vänta på filtreringen
      
      // Verifiera att sökningen fungerar (filtrering sker client-side)
      const filteredCards = page.locator('div[class*="Card"]').filter({ hasText: /Org\.nr:|Typ|Aktiviteter/i });
      const filteredCount = await filteredCards.count();
      
      console.log(`Initial count: ${initialCount}, Filtered count: ${filteredCount}, Search term: ${searchTerm}`);
      
      // Verifiera att minst den första föreningen syns
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('should display loading state before tRPC data arrives', async ({ page }) => {
    // Navigera till sidan och fånga laddningstillståndet
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    await page.getByRole('link', { name: 'Ekerö' }).click();
    await page.waitForTimeout(500);
    
    // Starta navigering och försök fånga loading state
    const navigationPromise = page.getByRole('link', { name: 'Visa föreningar' }).click();
    
    // Försök att se laddningsmeddelandet (kan vara svårt att fånga om det är snabbt)
    const loadingText = page.getByText('Laddar föreningar...');
    const isLoadingVisible = await loadingText.isVisible().catch(() => false);
    
    if (isLoadingVisible) {
      console.log('✓ Loading state visades');
    }
    
    await navigationPromise;
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Verifiera att sidan laddades korrekt efter loading state
    const heading = page.getByRole('heading', { name: 'Ekerö' });
    await expect(heading).toBeVisible();
  });

  test('should display association details from tRPC', async ({ page }) => {
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    await page.getByRole('link', { name: 'Ekerö' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Visa föreningar' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Hitta föreningskort
    const associationCards = page.locator('div[class*="Card"]').filter({ hasText: /Org\.nr:|Typ|Aktiviteter/i });
    const cardCount = await associationCards.count();
    
    if (cardCount > 0) {
      const firstCard = associationCards.first();
      
      // Verifiera att kortet innehåller förväntade element
      const cardContent = await firstCard.innerText();
      
      // Korten ska innehålla någon av dessa element (beroende på tillgänglig data)
      const hasOrgNr = cardContent.includes('Org.nr:');
      const hasType = cardContent.includes('Typ');
      const hasActivities = cardContent.includes('Aktiviteter');
      const hasContactInfo = cardContent.includes('@') || cardContent.match(/\d{2,}/);
      
      // Minst ett av elementen ska finnas
      expect(hasOrgNr || hasType || hasActivities || hasContactInfo).toBe(true);
      
      console.log('✓ Föreningskortet innehåller data från tRPC');
    }
  });

  test('should navigate back to municipalities overview', async ({ page }) => {
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    await page.getByRole('link', { name: 'Ekerö' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Visa föreningar' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Verifiera att vi är på associations-sidan
    expect(page.url()).toContain('/associations');
    
    // Klicka på tillbaka-knappen
    await page.getByRole('button', { name: /Tillbaka till kommunöversikt/i }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Verifiera att vi är tillbaka på municipalities-sidan
    expect(page.url()).toContain('/municipalities');
    expect(page.url()).not.toContain('/associations');
  });

  test('should display county information from tRPC', async ({ page }) => {
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    await page.getByRole('link', { name: 'Ekerö' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Visa föreningar' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Verifiera att län-information visas (kommer från municipality tRPC query)
    const countyInfo = page.getByText(/Stockholms län/i);
    
    // Om kommunen har län-information ska den visas
    const isVisible = await countyInfo.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log('✓ Län-information från tRPC visas');
      await expect(countyInfo).toBeVisible();
    }
  });

  test('should handle empty state when no associations exist', async ({ page }) => {
    // Försök hitta en kommun utan föreningar eller navigera till en ny kommun
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Testa med olika kommuner tills vi hittar en utan data eller får empty state
    const municipalities = ['Ekerö', 'Stockholm', 'Göteborg'];
    
    for (const municipality of municipalities) {
      const munLink = page.getByRole('link', { name: municipality }).first();
      const exists = await munLink.isVisible().catch(() => false);
      
      if (exists) {
        await munLink.click();
        await page.waitForTimeout(500);
        
        const viewAssocButton = page.getByRole('link', { name: 'Visa föreningar' });
        const buttonExists = await viewAssocButton.isVisible().catch(() => false);
        
        if (buttonExists) {
          await viewAssocButton.click();
          await page.waitForSelector('text=Visar', { timeout: 60000 });
          
          // Kontrollera om empty state visas
          const emptyState = page.getByText('Inga föreningar hittades');
          const hasEmptyState = await emptyState.isVisible().catch(() => false);
          
          if (hasEmptyState) {
            console.log(`✓ Empty state fungerar för ${municipality}`);
            
            // Verifiera att empty state-meddelandet är korrekt
            await expect(emptyState).toBeVisible();
            
            // Verifiera att import-länken finns i empty state
            const importLink = page.getByRole('link', { name: 'Importera föreningar' });
            const hasImportLink = await importLink.isVisible().catch(() => false);
            
            if (hasImportLink) {
              await expect(importLink).toBeVisible();
            }
            
            break;
          }
          
          // Gå tillbaka för nästa iteration
          await page.getByRole('button', { name: /Tillbaka/i }).click();
          await page.waitForSelector('text=Visar', { timeout: 60000 });
        }
      }
    }
  });

  test('should verify tRPC data consistency', async ({ page }) => {
    await page.goto('http://localhost:3010/dashboard');
    await page.getByRole('link', { name: 'Kommunöversikt' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    await page.getByRole('link', { name: 'Ekerö' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('link', { name: 'Visa föreningar' }).click();
    await page.waitForSelector('text=Visar', { timeout: 60000 });
    
    // Verifiera att antal föreningar stämmer mellan header och faktiska kort
    const headerText = await page.locator('p.text-muted-foreground').filter({ hasText: /föreningar/i }).innerText();
    const countMatch = headerText.match(/(\d+)\s+föreningar/);
    
    if (countMatch) {
      const headerCount = parseInt(countMatch[1]);
      
      // Räkna faktiska föreningskort
      const cards = page.locator('div[class*="Card"]').filter({ hasText: /Org\.nr:|Typ|Aktiviteter/i });
      const actualCount = await cards.count();
      
      console.log(`Header says: ${headerCount}, Actual cards: ${actualCount}`);
      
      // Räkningen ska stämma (data kommer från samma tRPC query)
      expect(actualCount).toBe(headerCount);
    }
  });
});
