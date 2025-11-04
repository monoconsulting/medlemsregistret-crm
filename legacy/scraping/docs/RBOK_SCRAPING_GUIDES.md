# Instruktion för RBOK-scraping

## Leverans

Följande filer ska levereras:

E:\projects\CRM\scraping\scripts\RBOK_BATCH_FILES_README.md - en detaljerad beskrivning om hur skripten fungerar och hur dessa används

E:\projects\CRM\scraping\scripts\rbok_import.bat - importera json till databas

E:\projects\CRM\scraping\scripts\rbok_scrape.bat - utför webscraping på samtliga listade kommuner

E:\projects\CRM\scraping\scripts\rbok_scrape_and_import.bat - både webscraping och import

E:\projects\CRM\scraping\scripts\rbok_test_scrape.bat - utför ett test för att kontrollera om skriptet fungerar på endast en kommun

| Fil                                                         | Beskrivning                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| E:\projects\CRM\scraping\scripts\RBOK_BATCH_FILES_README.md | en detaljerad beskrivning om hur skripten fungerar och hur dessa används |
| E:\projects\CRM\scraping\scripts\rbok_import.bat            | importera json till databas                                  |
| E:\projects\CRM\scraping\scripts\rbok_scrape.bat            | webscraping på samtliga listade kommuner                     |
| E:\projects\CRM\scraping\scripts\rbok_scrape_and_import.bat | både webscraping och import                                  |
| E:\projects\CRM\scraping\scripts\rbok_test_scrape.bat       | utför ett test för att kontrollera om skriptet fungerar på endast en kommun |



## Källa

Du ska som start hämta ut samtliga kommuner ur tabellen Municipality med platform=RBOK.

Dessa kommuner är det du ska scrapea



## JSON och Output Format

**Följ noggrant** reglerna i `E:\projects\CRM\scraping\docs\JSON_STANDARD.md`

**⚠️ Viktigt**: RBOK scrapers ska generera endast **Pretty JSON** (indenterad array). JSONL-format används inte längre.

### Filename Pattern

```
{municipality}_RBOK_{YYYY-MM-DD}_{HH-MM}.json
```

**Output-platser**:
- JSON-filer: `scraping/json/`
- Loggar: `scraping/logs/{municipality}.log` (appendar)

**Examples**:
- `scraping/json/Umeå_RBOK_2025-10-27_10-30.json`
- `scraping/json/Karlskoga_RBOK_2025-10-27_11-15.json`
- `scraping/json/Norrtälje_RBOK_2025-10-27_12-00.json`

**Filhantering**:
- Filer skrivs över vid nya körningar (ej versionerade)
- Importeraren läser endast den senaste filen baserat på filnamnet
- SOURCE_SYSTEM (`RBOK`) inkluderas i filnamnet för att undvika cross-contamination

# Kör följande ordning:

1. Klicka på accept cookies
2. Klicka på föreningsregister i menyn (Association register)
3. Välj maximalt antal poster per sida längst ner på sidan
4. Gå till sista sidan och undersök fältet som visar antal poster (586 of 586 items) - KOM IHÅG ANTALET!
5. Gå tillbaka till första sidan och starta med nummer 1. Hämta alla fält i första tabellen
6. Klicka på informationsikonen I kolumnen längst ute till höger.
7. Hämta samtliga fält i modalen 
8. Tryck på close/stäng längst nere till höger
9. Fortsätt och gör samma procedur för nummer två
10. Paginera framåt till nästa sida ända tills du kommer till sista sidan och sista posten (HÄR SKA DU JÄMFÖRA MED ANTALET).
11. När JSON-filen är klar så ska alla fält som finns på sidan finnas i motsvarande fält i json-filen. Du ska ha samma antal poster som identifierades i nummer 4. 

**VIKTIGT**

* Du behöver ej klicka på länkar till hemsidor eller epostadress - dessa ska bara scrapeas
* Du måste alltid som start ta fram det totala antalet föreningar du ska ska scrapea. Detta är avgörande för att vi får ett bra resultat. 
* Kontroll behöver göras så alla fält hamnar på rätt ställe i json.
* Filnamn får ej sparas med åäö eller liknande tecken

### Tillhörande exempel - Umeå

```
import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('test', async ({ page }) => {
  await page.goto('https://umea.rbok.se/foreningsregister');
  await page.getByRole('link', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Association register' }).click();
  await page.getByLabel('Default select example').selectOption('100');
  await page.getByRole('link', { name: 'Last' }).click();
  await page.getByText('- 586 of 586 items').click();
  await page.getByText('- 586 of 586 items').click();
  await page.getByText('- 586 of 586 items').click();
  await page.getByText('- 586 of 586 items').click();
  await page.getByText('- 586 of 586 items').click();
  await page.getByRole('link', { name: 'First' }).click();
  await page.getByRole('cell', { name: 'AB Volvo Umeverkens Fritidsklubb', exact: true }).click();
  await page.getByRole('cell', { name: 'Idrott' }).first().click();
  await page.locator('td').nth(3).click();
  await page.locator('td').nth(3).click();
  await page.getByRole('link', { name: 'Show more information about AB Volvo Umeverkens Fritidsklubb' }).click();
  await page.getByRole('heading', { name: 'AB Volvo Umeverkens' }).click();
  await page.getByText('Contact').click();
  await page.getByLabel('AB Volvo Umeverkens Fritidsklubb', { exact: true }).getByText('Close').click();
  await page.getByRole('cell', { name: 'AC Discgolf', exact: true }).click();
  await page.getByRole('cell', { name: 'Idrott' }).nth(1).click();
  await page.locator('td').filter({ hasText: 'https://acdiscgolf.wixsite.' }).click();
  await page.getByRole('link', { name: 'Show more information about' }).nth(3).click();
  await page.getByRole('heading', { name: 'AC Discgolf' }).click();
  await page.getByText('Discgolf förening som idag').click();
  await page.getByText('Operations Discgolf').click();
  await page.getByText('Areas Holmsund/Obbola').click();
  await page.getByText('Contact').click();
  await page.locator('div:nth-child(6) > div:nth-child(2)').click();
  const page1Promise = page.waitForEvent('popup');
  await page.locator('div:nth-child(6) > div:nth-child(3)').click();
  const page1 = await page1Promise;
  await page.getByLabel('AC Discgolf', { exact: true }).getByText('Close').click();
  await page.getByRole('link', { name: 'Show more information about Association of Cameroonians in Umeå' }).nth(1).click();
  await page.getByRole('heading', { name: 'Association of Cameroonians' }).click();
  await page.getByText('The Cameroonian Association').click();
  await page.getByText('Operations').click();
  await page.getByText('Operations BarnkalasFotbollGruppträningKonsertMöteStudieverksamhet').click();
  await page.getByText('Target groups').click();
  await page.getByText('Target groups Barn (0-6 år)').click();
  await page.getByText('Areas').click();
  await page.getByText('Areas BackenområdetCentrala').click();
  await page.getByText('Contact', { exact: true }).click();
  await page.getByText('Talla Simo Valerie Rostan').click();
  await page.getByText('+').click();
  await page.locator('div:nth-child(6) > div:nth-child(4)').click();
  await page.getByLabel('Association of Cameroonians in Umeå', { exact: true }).getByText('Close').click();
  await page.getByRole('link', { name: 'Last' }).click();
  await page.getByRole('link', { name: 'Show more information about Överboda SK' }).click();
  await page.getByRole('heading', { name: 'Överboda SK' }).click();
  await page.locator('div').filter({ hasText: 'Contact' }).nth(5).click();
  await page.getByLabel('Överboda SK', { exact: true }).getByText('Close').click();
});
```





Karlskoga

```
import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('test', async ({ page }) => {
  await page.goto('https://karlskoga.rbok.se/foreningsregister');
  await page.getByRole('link', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Association register' }).click();
  await page.getByLabel('Default select example').selectOption('100');
  await page.getByRole('listitem').filter({ hasText: 'Go to last page' }).click();
  await page.getByText('- 82 of 82 items').click();
  await page.getByRole('link', { name: 'Show more information about ABF Örebro län' }).click();
  await page.getByText('Operations').click();
  await page.getByText('Operations Utbildning').click();
  await page.getByText('Operations Utbildning').click();
  await page.getByText('Target groups Barn och ungdom').click();
  await page.getByText('Contact').click();
  await page.getByText('Jörgen Danielsson').click();
  await page.getByText('Jörgen Danielsson').click();
  await page.getByText('010-').click();
  await page.getByLabel('ABF Örebro län', { exact: true }).getByText('Close').click();
  await page.getByRole('link', { name: 'Show more information about V' }).click();
  await page.getByText('Operations').click();
  await page.getByText('Operations Båt verksamhet').click();
  await page.getByText('Target groups').click();
  await page.getByText('Target groups Vuxna (26+ år)').click();
  await page.getByText('Contact').click();
  await page.getByText('Birgit Karlsson').click();
  await page.getByText('073-').click();
  await page.getByLabel('Värmlands Bergslags Båtförening', { exact: true }).getByText('Close').click();
});
```



Norrtälje:

```
import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('test', async ({ page }) => {
  await page.goto('https://norrtalje.rbok.se/foreningsregister');
  await page.getByRole('link', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Association register' }).click();
  await page.getByLabel('Default select example').selectOption('100');
  await page.getByRole('link', { name: 'Last' }).click();
  await page.getByText('- 132 of 132 items').click();
  await page.getByRole('link', { name: 'First' }).click();
  await page.getByRole('cell', { name: '1870 Väddö iogt-nto', exact: true }).click();
  await page.getByRole('cell', { name: 'Samlingslokalhållande förening' }).first().click();
  const page1Promise = page.waitForEvent('popup');
  await page.locator('td').filter({ hasText: 'https://iogt-ntovaddo.medlem.' }).click();
  const page1 = await page1Promise;
  await page.getByRole('link', { name: 'Show more information about' }).nth(1).click();
  await page.getByText('Nykterhetsförening').click();
  await page.getByText('Nykterhetsförening Contact').click();
  await page.locator('[id="0c50394c-d443-4835-a259-a989b3eddf48"] > .modal-dialog > .modal-content > .modal-header').click();
  await page.getByRole('heading', { name: 'Väddö iogt-nto' }).click();
  await page.getByText('0707401532').click();
  await page.locator('div:nth-child(4) > div:nth-child(4)').click();
  const page2Promise = page.waitForEvent('popup');
  await page.locator('div:nth-child(4) > div:nth-child(5)').click();
  const page2 = await page2Promise;
  const page3Promise = page.waitForEvent('popup');
  await page.locator('div:nth-child(4) > div:nth-child(5)').click();
  const page3 = await page3Promise;
  await page.getByLabel('1870 Väddö iogt-nto', { exact: true }).getByText('Close').click();
});
```

Malmö

```
import { test, expect } from '@playwright/test';

test.use({
  viewport: {
    height: 1256,
    width: 1760
  }
});

test('test', async ({ page }) => {
  await page.goto('https://malmo.rbok.se/foreningsregister');
  await page.getByRole('link', { name: 'Accept' }).click();
  await page.getByRole('link', { name: 'Association register' }).click();
  await page.getByLabel('Default select example').selectOption('100');
  await page.getByRole('link', { name: 'Last' }).click();
  await page.getByText('- 561 of 561 items').click();
  await page.getByText('- 561 of 561 items').click();
  await page.getByRole('link', { name: 'First' }).click();
  await page.getByRole('cell', { name: 'AC Malmö', exact: true }).click();
  await page.getByRole('cell', { name: 'Idrottsförening' }).first().click();
  await page.locator('td').filter({ hasText: 'https://jcastroperez.wixsite.' }).click();
  await page.getByRole('link', { name: 'Show more information about' }).nth(1).click();
  await page.getByRole('heading', { name: 'AC Malmö' }).click();
  await page.locator('center > #logoImg').click();
  await page.getByText('Vi är en ideell idrottsfö').click();
  await page.getByText('Vi är en ideell idrottsfö').click();
  await page.getByText('Contact').click();
  await page.getByText('Matthew Kvisth').click();
  await page.getByRole('link', { name: 'acmalmo2024@gmail.com' }).click();
  await page.getByRole('link', { name: 'acmalmo2024@gmail.com' }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.locator('div:nth-child(4) > div:nth-child(4)').click();
  const page1 = await page1Promise;
});
```



## Liknande skript

Liknande skript har skapats för fri, IBGO och actors:

### FRI

E:\projects\CRM\scraping\scripts\FRI_BATCH_FILES_README.md

E:\projects\CRM\scraping\scripts\fri_scrape.bat

E:\projects\CRM\scraping\scripts\fri_scrape_and_import.bat

E:\projects\CRM\scraping\scripts\fri_import.bat 



### IBGO

E:\projects\CRM\scraping\scripts\IBGO_BATCH_FILES_README.md

E:\projects\CRM\scraping\scripts\ibgo_import.bat

E:\projects\CRM\scraping\scripts\ibgo_scrape_and_import.bat

E:\projects\CRM\scraping\scripts\ibgo_scrape.bat



### ACTOR

E:\projects\CRM\scraping\scripts\ACTOR_BATCH_FILES_README.md

E:\projects\CRM\scraping\scripts\actor_import.bat

E:\projects\CRM\scraping\scripts\actor_scrape.bat

E:\projects\CRM\scraping\scripts\actor_scrape_and_import.bat

E:\projects\CRM\scraping\scripts\actor_test_scrape.bat

