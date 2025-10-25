# Database Backup Scripts

Detta är backup-skript för CRM-systemets MySQL-databas.

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
