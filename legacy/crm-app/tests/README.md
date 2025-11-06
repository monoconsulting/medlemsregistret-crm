# Municipality Table Tests

Playwright-tester för att verifiera att alla fält finns och är korrekt formaterade i Municipality-tabellen.

## Installation

### 1. Installera Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### 2. Lägg till test-script i package.json

Lägg till följande under "scripts" i `package.json`:

```json
"test": "playwright test",
"test:ui": "playwright test --ui",
"test:debug": "playwright test --debug",
"test:municipalities": "playwright test tests/municipality-table-fields.spec.ts"
```

## Användning

### Kör alla tester

```bash
npm test
```

### Kör endast municipality-tester

```bash
npm run test:municipalities
```

### Kör tester med UI Mode

```bash
npm run test:ui
```

### Kör tester i debug-läge

```bash
npm run test:debug
```

## Vad testerna verifierar

### 1. **Tabellhuvuden**
Verifierar att alla kolumner finns:
- Kommun (Municipality name)
- Kod (4-ställig stadskod)
- Län (County)
- Länskod (2-ställig länskod)
- Landskap (Province)
- Befolkning (Population)
- Plattform (Platform)
- Status (Register status)

### 2. **Kodformatering**
Verifierar att koder är korrekt formaterade:
- **Stadskod**: Alltid 4 siffror med ledande nollor (ex: `0180`, `1490`, `2039`)
- **Länskod**: Alltid 2 siffror med ledande nollor (ex: `01`, `14`, `20`)

### 3. **Dataverifiering**
Testerna verifierar specifika kommuner:

#### Stockholm (0180, länskod 01)
- Största befolkning
- Fullständiga fält

#### Gävle (2180, länskod 21)
- Har både plattform (FRI) och status (Klar)

#### Arboga (1984, länskod 19)
- Status: Klar
- Fullständiga fält

#### Falun (2080, länskod 20)
- Plattform: Actors Smartbook

#### Älvdalen (2039, länskod 20)
- Verifiera formatering av kod med ledande nolla

### 4. **Konsistenskontroller**
- Totalt antal kommuner (289)
- Kodformat konsistent över alla kommuner
- Hantering av kommuner utan plattform eller status
- Befolkningsdata visas korrekt

## Förutsättningar

Innan testerna körs måste:
1. ✅ Docker containers köra (dev eller prod)
2. ✅ Applikationen vara tillgänglig på `http://localhost:3010`
3. ✅ Databasen vara seedat med alla 289 kommuner
4. ✅ Alla koder vara korrekt formaterade (4-ställiga stadskoder, 2-ställiga länskoder)

## Starta miljön innan test

```bash
# Starta dev-miljön
.\docker-dev-start.bat

# Eller starta prod-miljön
.\docker-prod-start.bat

# Vänta tills applikationen är igång på http://localhost:3010
```

## Troubleshooting

### Test timeout
Om tester tar timeout, öka timeout i test-filen:
```typescript
test.setTimeout(30000); // 30 sekunder
```

### Fel port
Om applikationen körs på en annan port än 3010, uppdatera URL:en i testet:
```typescript
await page.goto('http://localhost:RÄTT_PORT/municipalities');
```

### Tabellen laddas inte
Kontrollera att:
1. Databasen innehåller data
2. API:et fungerar korrekt
3. Inga JavaScript-fel i konsolen

## Playwright Configuration

För att skapa en Playwright-konfiguration, kör:

```bash
npm init playwright@latest
```

Eller skapa manuellt `playwright.config.ts` i projektets root.

## Exempel på förväntad output

```
Running 10 tests using 1 worker

  ✓ should display all required municipality fields in the table (2.1s)
  ✓ should display formatted codes for municipalities (1.8s)
  ✓ should display all data fields for a municipality with complete data (2.3s)
  ✓ should show platform information for municipalities with platform (1.5s)
  ✓ should verify municipality with all fields populated (1.9s)
  ✓ should verify total number of municipalities (1.2s)
  ✓ should verify code format consistency (2.7s)
  ✓ should handle municipalities without platform or status (1.6s)
  ✓ should display population data (1.4s)

  10 passed (18.5s)
```

## Continuous Integration

För CI/CD, lägg till i din pipeline:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm test
```
