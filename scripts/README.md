# Database Scripts

Detta är skript för hantering av CRM-systemets MySQL-databas.

## populate_tags.bat

Populerar Tag-tabellen med data från föreningarnas fält (types, activities, categories) och länkar föreningar till dessa taggar.

### Användning

1. Se till att databasen är tillgänglig (dev- eller prod-miljö körs).

2. Kör skriptet:
   ```bash
   scripts\populate_tags.bat
   ```

### Vad gör skriptet?

- Extraherar unika taggar från `types`, `activities`, och `categories` fält i Association-tabellen
- Normaliserar till lowercase och deduplicerar
- Skapar unika Tag-poster (upsert)
- Länkar föreningar till taggarna (skriver över befintliga länkar)
- Bevarar originalvärden i fälten oförändrade

### Varningar

- Detta modifierar databasen permanent
- Tag-tabellen antas vara tom initialt
- Körs i batchar om 100 föreningar för prestanda

### Efter körning

- Kontrollera att taggar skapades: `npx prisma db studio`
- Verifiera att föreningar har taggar länkade

## dbbackup_full.bat

Skapar en fullständig backup av alla databaser i MySQL-containern.

### Användning

1. Se till att antingen dev- eller prod-miljön körs:
   ```bash
   # För dev-miljö
   docker compose -f docker-compose.dev.yml up -d

   # För prod-miljö
   docker compose -f docker-compose.prod.yml up -d
   ```

2. Kör backup-skriptet:
   ```bash
   scripts\dbbackup_full.bat
   ```

### Vad gör skriptet?

- Detekterar automatiskt vilken miljö (dev/prod) som körs
- Skapar en fullständig mysqldump av alla databaser
- Sparar backup-filen i `.dbbackup/` katalogen
- Filnamnet får formatet: `mcrm_dbdump_YYYY-MM-DD_HH-MM.sql`
- Inkluderar:
  - Alla databaser (`--all-databases`)
  - Stored procedures och functions (`--routines`)
  - Triggers (`--triggers`)
  - Events (`--events`)
  - Använder single transaction för konsistens (`--single-transaction`)

### Backup-filer

Alla backups sparas i:
```
.dbbackup/
├── mcrm_dbdump_2025-10-25_14-30.sql
├── mcrm_dbdump_2025-10-25_09-15.sql
└── ...
```

### Återställning från backup

För att återställa en backup:

```bash
# Hitta rätt container
docker ps | findstr mysql

# Återställ backup (exempel)
docker exec -i crm-members-prod-mysql-1 mysql -u crm_user -p < .dbbackup\mcrm_dbdump_2025-10-25_14-30.sql
```

### Felsökning

Om skriptet misslyckas, kontrollera:

1. **Container körs inte:**
   ```bash
   docker ps | findstr mysql
   ```

2. **Fel lösenord:** Kontrollera `.env` filen att lösenorden stämmer

3. **Disk fullt:** Kontrollera att det finns tillräckligt med diskutrymme

4. **mysqldump finns inte:** Verifiera att MySQL-containern innehåller mysqldump:
   ```bash
   docker exec crm-members-prod-mysql-1 mysqldump --version
   ```

### Automatisering

För att schemalägga automatiska backups, skapa en Windows Task Scheduler uppgift som kör skriptet regelbundet.
