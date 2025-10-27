# Actor Smartbook Batch Files - Användarguide

## Översikt

Dessa batch-filer automatiserar scraping och import av föreningsdata från kommuner som använder Actor Smartbook-plattformen.

## Batch-filer

### 🚀 Huvudfiler

#### `actor_scrape_and_import.bat`
**Kör hela processen** - scraping + import i ett enda kommando.

- Scrapar alla 22 kommuner med Actor Smartbook
- Importerar automatiskt all data till databasen
- **Estimerad tid**: 15-20 minuter totalt
- **Använd när**: Du vill köra hela processen från start till mål

**Steg:**
```
1. Dubbelklicka på actor_scrape_and_import.bat
2. Tryck Enter för att starta
3. Vänta medan scraping körs (~15-20 min)
4. Import körs automatiskt efter scraping (~1-2 min)
5. Klart!
```

---

### 📦 Separata filer (mer kontroll)

#### `actor_scrape.bat`
**Endast scraping** - genererar JSON-filer.

- Scrapar alla kommuner
- Sparar data till `scraping/json/`
- Sparar loggar till `scraping/logs/`
- **Estimerad tid**: 15-20 minuter

**Använd när**: Du vill granska JSON-filerna innan import.

#### `actor_import.bat`
**Endast import** - läser JSON-filer och sätter in i databas.

- Importerar alla JSON-filer från `scraping/json/`
- Skapar eller uppdaterar föreningar i databasen
- **Estimerad tid**: 1-2 minuter

**Använd när**: Du redan har kört scraping och vill importera data.

---

### 🧪 Testfiler

#### `actor_test_scrape.bat`
**Testning** - scrapar endast Gnosjö (72 föreningar).

- Snabb test på en liten kommun
- Verifierar att allt fungerar
- **Estimerad tid**: ~30 sekunder

**Använd när**: Du vill testa innan du kör bulk-scraping på alla kommuner.

---

## Vanliga arbetsflöden

### Scenario 1: Första gången (rekommenderat)
```
1. actor_test_scrape.bat        ← Testa först
2. actor_import.bat             ← Verifiera import
3. Granska data i databasen
4. actor_scrape_and_import.bat  ← Kör allt när du är nöjd
```

### Scenario 2: Snabb körning
```
1. actor_scrape_and_import.bat  ← Kör allt på en gång
```

### Scenario 3: Manuell kontroll
```
1. actor_scrape.bat            ← Scrapa först
2. Granska JSON-filerna
3. actor_import.bat            ← Importera när du är nöjd
```

### Scenario 4: Re-import av befintlig data
```
1. actor_import.bat            ← Importera från befintliga JSON-filer
```

---

## Output-filer

### Genererade filer

**JSON-filer** (`scraping/json/`):
```
alingsas_associations_[uuid]_2025-10-26.json
alvdalen_associations_[uuid]_2025-10-26.json
...
```

**JSONL-filer** (`scraping/json/`):
```
alingsas_associations_[uuid]_2025-10-26.jsonl
alvdalen_associations_[uuid]_2025-10-26.jsonl
...
```

**Loggar** (`scraping/logs/`):
```
alingsas.log
alvdalen.log
...
```

**Sammanfattning** (`scraping/json/`):
```
bulk_scrape_summary_2025-10-26.json
```

---

## Kommuner som scrapas

Totalt 12 kommuner scrapade med 3,425 föreningar (99.6% success rate):

| Kommun | Föreningar | Status | Importerat |
|--------|-----------|--------|------------|
| Alingsås | 242 | ✅ Scrapad | ✅ 242 |
| Älvdalen | 95 | ✅ Scrapad | ✅ 95 |
| Boden | 224 | ✅ Scrapad | ✅ 221 |
| Bollnäs | 169 | ✅ Scrapad | ✅ 168 |
| Borås | 313 | ✅ Scrapad | ✅ 313 |
| Falun | 788 | ✅ Scrapad | ✅ 788 |
| Hedemora | 200 | ✅ Scrapad | ✅ 200 |
| Kiruna | 247 | ✅ Scrapad | ✅ 243 |
| Mora | 121 | ✅ Scrapad | ✅ 121 |
| Sandviken | 304 | ✅ Scrapad | ✅ 303 |
| Sollefteå | 282 | ✅ Scrapad | ✅ 282 |
| Sundsvall | 440 | ✅ Scrapad | ✅ 437 |

**Totalt importerat**: 3,413 av 3,425 föreningar (99.6% success rate)

---

## Krav

- **Database**: MySQL måste köra på `localhost:3316`
- **Node.js**: Installerat
- **Internet**: Krävs för att hämta data från API:erna

---

## Felsökning

### Problem: "Cannot find module"
**Lösning**: Kör `npm install` i `crm-app/` mappen först.

### Problem: "Database connection failed"
**Lösning**: Kontrollera att MySQL körs och `.env` har rätt konfiguration.

### Problem: Batch-filen kraschar
**Lösning**:
1. Öppna Command Prompt
2. Navigera till `scraping/scripts/`
3. Kör batch-filen manuellt för att se felmeddelanden

### Problem: JSON-filer saknas vid import
**Lösning**: Kör `actor_scrape.bat` först för att generera filerna.

---

## Tips

1. **Granska loggarna** efter scraping för att se om något gick fel
2. **Backup database** innan stor import
3. **Testa först** med `actor_test_scrape.bat`
4. **Rätta filnamn** - inga åäö i filnamn (redan fixat i skripten)

---

## Uppdaterad: 2025-10-26
