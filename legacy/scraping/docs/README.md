# Web-Scraping Instruktioner

Denna mapp innehåller instruktioner för web-scraping av föreningar från svenska kommuner.

## Översikt
- Skript sparas i `/scraping/scripts/` och heter `kommun_scrape.ts`.
- JSON-resultat sparas i `/scraping/json/` i fullständigt format.
- Varje skript använder Playwright för att scrapa data och importerar direkt till databasen.

## Hur man skapar ett nytt scrape-skript
1. Kopiera ett befintligt skript som mall (t.ex. `alvdalen_scrape.ts`).
2. Ändra URL och selektorer för den nya kommunen.
3. Kör skriptet från systemet via "Web-scraping" menyn.
4. JSON-filen skapas automatiskt och data importeras till DB.

## Körning
Skript körs via Node.js. Se till att Playwright är installerat.

## Historik
JSON-filer sparas med tidsstämplar för historisk spårning.