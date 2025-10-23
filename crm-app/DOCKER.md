# CRM Docker Setup

## 🐳 Översikt

Projektet innehåller komplett Docker-uppsättning för både development och production.

### Tjänster

- **MySQL 8.0** - Huvuddatabas (port 3306)
- **phpMyAdmin** - Databashantering (port 8080)
- **Redis 7** - Cache layer (port 6379)
- **Next.js 15** - CRM Application (port 3000)

## 🚀 Development

### Starta development miljö:
```bash
# Windows
dev-start.bat

# Linux/Mac
docker compose -f docker-compose.dev.yml up -d
```

### Features i dev-miljö:
- ✅ Hot reload (volume mounts)
- ✅ Auto Prisma migrations
- ✅ Debug-friendly
- ✅ Snabbare builds (Dockerfile.dev)

### Åtkomst:
- **App**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080
  - Server: `mysql`
  - User: `crm_user`
  - Password: `crm_password`
- **MySQL Direct**: `localhost:3306`
- **Redis**: `localhost:6379` (password: `redis_dev`)

### Stoppa dev-miljö:
```bash
# Windows
dev-stop.bat

# Linux/Mac
docker compose -f docker-compose.dev.yml down
```

## 📦 Production

### Starta production miljö:
```bash
# Windows
prod-start.bat

# Linux/Mac
docker compose up -d --build
```

### Features i prod-miljö:
- ✅ Multi-stage optimerad build
- ✅ Minimal image size
- ✅ Health checks
- ✅ Auto-restart
- ✅ Persistent volumes

### ⚠️ Viktigt för production:
Ändra dessa i `docker-compose.yml`:
```yaml
MYSQL_ROOT_PASSWORD: "DIN_SÄKRA_PASSWORD"
MYSQL_PASSWORD: "DIN_SÄKRA_PASSWORD"
NEXTAUTH_SECRET: "DIN_RANDOM_STRING"
redis command: redis-server --requirepass DIN_REDIS_PASSWORD
```

## 🔧 Prisma Migrations

### Kör migrations manuellt:
```bash
# Development
docker compose -f docker-compose.dev.yml exec app npx prisma migrate dev

# Production
docker compose exec app npx prisma migrate deploy
```

### Öppna Prisma Studio:
```bash
docker compose -f docker-compose.dev.yml exec app npx prisma studio
```

## 📊 Loggar

### Visa app-loggar:
```bash
# Development
docker compose -f docker-compose.dev.yml logs -f app

# Production
docker compose logs -f app
```

### Visa alla loggar:
```bash
docker compose logs -f
```

## 🗄️ Databas Management

### Backup MySQL:
```bash
docker compose exec mysql mysqldump -u crm_user -pcrm_password crm_db > backup.sql
```

### Restore MySQL:
```bash
docker compose exec -T mysql mysql -u crm_user -pcrm_password crm_db < backup.sql
```

### Connect till MySQL shell:
```bash
docker compose exec mysql mysql -u crm_user -pcrm_password crm_db
```

## 🧹 Rensning

### Ta bort containers och volumes:
```bash
# Development
docker compose -f docker-compose.dev.yml down -v

# Production
docker compose down -v
```

### Rensa Docker helt:
```bash
docker system prune -a --volumes
```

## 🔍 Troubleshooting

### App startar inte:
```bash
# Kontrollera loggar
docker compose logs app

# Rebuild container
docker compose up -d --build --force-recreate app
```

### MySQL connection error:
```bash
# Kontrollera MySQL är uppe
docker compose exec mysql mysqladmin ping -h localhost -u root -proot

# Verifiera DATABASE_URL
docker compose exec app env | grep DATABASE_URL
```

### Redis connection error:
```bash
# Testa Redis
docker compose exec redis redis-cli ping

# Med password
docker compose exec redis redis-cli -a redis_dev ping
```

## 📝 Environment Variables

Skapa `.env.local` för lokala overrides:
```env
DATABASE_URL="mysql://crm_user:crm_password@localhost:3306/crm_db"
REDIS_URL="redis://:redis_dev@localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev_secret"
```

## 🏗️ Project Structure

```
crm-app/
├── docker-compose.yml          # Production setup
├── docker-compose.dev.yml      # Development setup
├── Dockerfile                  # Production multi-stage
├── Dockerfile.dev             # Development simple
├── dev-start.bat              # Dev start script
├── dev-stop.bat               # Dev stop script
├── prod-start.bat             # Prod start script
├── prod-stop.bat              # Prod stop script
└── storage/                   # Persistent data
    ├── mysql/                 # MySQL data
    └── redis/                 # Redis data
```

## 🔐 Security Checklist för Production

- [ ] Ändra alla default passwords
- [ ] Generera stark NEXTAUTH_SECRET
- [ ] Använd secrets för känslig data
- [ ] Aktivera SSL/TLS för MySQL
- [ ] Konfigurera firewall rules
- [ ] Begränsa phpMyAdmin åtkomst
- [ ] Aktivera Redis AOF persistence
- [ ] Regular backups
- [ ] Monitoring och alerting
- [ ] Log rotation

## 📚 Nästa Steg

1. Kör `dev-start.bat` för att starta dev-miljön
2. Öppna http://localhost:3000
3. Logga in på phpMyAdmin (http://localhost:8080)
4. Kör Prisma migrations om behövs
5. Börja utveckla! 🎉
