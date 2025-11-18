# Buggrapport: Taggenerering – `tag generation script not found`

**Datum:** 2025-11-11  
**Severity:** HIGH  
**Status:** ÖPPEN  
**Miljö:** Produktion (Loopia PHP + statiskt publicerad Next.js)

---

## 📋 Sammanfattning

`Starta generering`-knappen på taggsidan (`/tags`) initierar front-end logik korrekt men backend-API:t svarar med `Tag generation script not found`. Flödet från UI → API → bakgrundsskript är intakt, men PHP-endpointen (`api/tag_generation.php`) hittar inte `scripts/populate_tags_v2.php` i driftmiljön och markerar jobbet som misslyckat innan själva genereringen hinner starta.

---

## 🔁 Flöde från knapptryckning till färdigt jobb

1. **UI-komponent (Next.js)**
   - `TagGenerationTab` laddas i `TagsPage` och håller lokalt state för körläge, källa och aktuell jobstatus (`crm-app/app/tags/components/tag-generation-tab.tsx:66-205`).
   - `handleTrigger`:
     - Bekräftelse för execute-läge.
     - POST via `api.triggerTagGeneration`.
     - Initierar polling med 2 s intervall via `api.getTagGenerationStatus` tills status ≠ `running`.
     - Visar toast + uppdaterar progress + rapportlänk om `reportUrl` sätts av backend.

2. **API-klient**
   - `api.triggerTagGeneration` och `api.getTagGenerationStatus` kapslar runt `/api/tag_generation.php` (`crm-app/lib/api.ts:938-986`).
   - Båda requesterna skickar JSON + inkluderar credentials/CSRF via `jsonFetch`.

3. **PHP-endpoint**
   - `POST /api/tag_generation.php` kräver inloggad ADMIN, CSRF-token och rate-limit (5/h) (`api/tag_generation.php:45-55`).
   - `handle_trigger_generation`:
     - Validerar `mode` + `source` och skapar rad i `TagGenerationRun` (`api/tag_generation.php:65-124`).
     - Försöker lösa projektroten och bygga sökvägen `{$projectRoot}/scripts/populate_tags_v2.php`.
     - Om `file_exists` returnerar false loggas `tag-generation.script-not-found`, jobbet markeras `failed` och API:t svarar 500 (`api/tag_generation.php:125-177`).
     - När skriptet hittas byggs ett bakgrundskommando `php scripts/populate_tags_v2.php --mode=... --source=... --job-id=...` och körs asynkront (Windows: `start /B`, *nix*: `&`) (`api/tag_generation.php:179-194`).

4. **Bakgrundsskript**
   - `scripts/populate_tags_v2.php` laddar `.env`, kopplar upp mot databasen och kör fem steg: (1) läs taxonomi, (2) bearbeta föreningar batchvis, (3) skriv CSV-rapport, (4) uppdatera `TagGenerationRun`, (5) skriv sammanfattning (`scripts/populate_tags_v2.php:1-520`).
   - Funktionerna `updateProgress` samt `updateJobRecord` skickar statistik + rapport-url (`/reports/tag_generation/<filnamn>`) tillbaka till databasen så att polling-UI:t kan visa live-data (`scripts/populate_tags_v2.php:556-637`).

5. **Statuspollning**
   - `GET /api/tag_generation.php?jobId=<id>` hämtar rader från `TagGenerationRun` och serialiserar statistik, fel och rapport-url (`api/tag_generation.php:214-272`).
   - UI:t tolkar `status` och visar `Kör...`, `Klar` eller `Misslyckades` banners samt progress/rapportknapp.

---

## 🚨 Fynd

| Del | Observation |
| --- | ----------- |
| Frontend | Statehanteringen och knappens `onClick` pekar redan mot rätt API-kall (`crm-app/app/tags/components/tag-generation-tab.tsx:66-117`). Ingen logikbugg hittades på klientsidan; UI:t visar serverfel korrekt. |
| API-klient | `api.triggerTagGeneration` skickar endast `mode` + `source`. Jobb-ID genereras på servern och används sedan för polling. Inga fel här (`crm-app/lib/api.ts:938-985`). |
| PHP-endpoint | Söker hårdkodat efter `scripts/populate_tags_v2.php` relativt projektroten och failar om filen inte finns eller saknar läsrättigheter (`api/tag_generation.php:125-177`). Detta är exakt den gren som returnerar `Tag generation script not found`. |
| Bakgrundsskript | Filen finns i repo (`scripts/populate_tags_v2.php`) men följer inte automatiskt med statisk publicering av Next.js eller PHP-api:t på Loopia. Om `scripts/` inte deployas tillsammans med `api/` blir `file_exists` alltid `false`. |

---

## ✅ Rekommenderade åtgärder

1. **Säkerställ distribution av PHP-scriptet**
   - Lägg till `scripts/populate_tags_v2.php` (och dess beroenden, t.ex. `scripts/reports/`) i deploymentskriptet/FTP-synken så att filen faktiskt finns på servern där `api/tag_generation.php` körs.
   - Alternativ: flytta scriptet till `api/scripts/` så att det hamnar inom samma publicerade rot, eller exponera sökvägen via konfig (t.ex. `TAG_SCRIPT_PATH` i `.env`) i stället för hårdkodad relativ path.

2. **Monitorera loggarna**
   - Leta efter `tag-generation.script-not-found` i eventloggen för att verifiera när felet upphör.

3. **(Valfritt) Förbättra felmeddelandet**
   - Returnera även den sökväg som söktes (`$scriptPath`) i 500-responsen så att drift enkelt ser var filen saknas.

När scriptet ligger på rätt plats kommer flödet ovan att kunna fortskrida: bakgrundsskriptet uppdaterar `TagGenerationRun` och UI:t kommer gå över från “Misslyckades” till “Klar” med rapportlänk.

---

## 🔎 Öppna frågor

- Behöver `scripts/` få egna rättigheter (t.ex. `0755`) på servern?  
- Ska rapporterna (`reports/tag_generation`) vara åtkomliga publikt eller skyddas via auth? Detta påverkar hur `reportUrl` levereras till UI:t.
