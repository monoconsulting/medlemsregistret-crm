# Environment Configuration Guide

## 📋 Översikt

Projektet använder olika environment-filer för olika användningsfall:

| Fil | Användning | Committas? |
|-----|-----------|-----------|
| `.env` | Docker development (standard) | ✅ Ja (inga secrets) |
| `.env.example` | Template för Docker | ✅ Ja |
| `.env.local.example` | Template för lokal dev | ✅ Ja |
| `.env.local` | Lokal utveckling utan Docker | ❌ Nej (.gitignore) |
| `.env.production` | Production overrides | ❌ Nej (.gitignore) |

## 🚀 Snabbstart

### Med Docker (Rekommenderat)
```bash
# .env finns redan med korrekta värden för Docker
docker compose -f docker-compose.dev.yml up -d
```

### Utan Docker (Lokal MySQL/Redis)
```bash
# Kopiera template
cp .env.local.example .env.local

# Redigera .env.local med dina lokala värden
# Kör Next.js direkt
npm run dev
```

## 🔧 Konfigurationsgrupper

### 1. Database (KRÄVS)
```env
# Docker (använd service name)
DATABASE_URL="mysql://crm_user:crm_password@mysql:3306/crm_db"

# Lokal (använd localhost)
DATABASE_URL="mysql://root:password@localhost:3306/crm_db"
```

**Skapa databas manuellt:**
```sql
CREATE DATABASE crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Redis (KRÄVS för caching)
```env
# Docker
REDIS_URL="redis://:redis_dev@redis:6379"

# Lokal
REDIS_URL="redis://:your_password@localhost:6379"
```

**Installera Redis lokalt:**
```bash
# Windows (med Chocolatey)
choco install redis-64

# Mac
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

### 3. NextAuth (KRÄVS för autentisering)
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="din_starka_hemliga_nyckel"
```

**Generera säker secret:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

### 4. Google OAuth (Valfritt)
```env
GOOGLE_CLIENT_ID="din-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="din-client-secret"
```

**Skaffa credentials:**
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa nytt projekt eller välj befintligt
3. Aktivera "Google+ API"
4. Gå till "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 5. AI Providers (Valfritt)

#### OpenAI
```env
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-4-turbo-preview"
AI_PROVIDER="openai"
```
Skaffa API-nyckel: https://platform.openai.com/api-keys

#### Anthropic (Claude)
```env
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-opus-20240229"
AI_PROVIDER="anthropic"
```
Skaffa API-nyckel: https://console.anthropic.com/

#### Ollama (Lokal AI)
```env
# För Docker
OLLAMA_HOST="http://host.docker.internal:11434"

# För lokal
OLLAMA_HOST="http://localhost:11434"

OLLAMA_MODEL="llama2"
AI_PROVIDER="ollama"
```

**Installera Ollama:**
```bash
# Windows/Mac/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Starta Ollama och ladda ner modell
ollama serve
ollama pull llama2
```

### 6. Email (Valfritt)

#### SMTP
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@medlemsregistret.se"
```

**Gmail App Password:**
1. Aktivera 2FA på ditt Google-konto
2. Gå till https://myaccount.google.com/apppasswords
3. Generera en app password för "Mail"

#### SendGrid (Alternativ)
```env
SENDGRID_API_KEY="SG...."
```
Skaffa API-nyckel: https://app.sendgrid.com/settings/api_keys

## 🔒 Säkerhet

### Production Checklist

- [ ] Ändra alla default passwords
- [ ] Generera stark `NEXTAUTH_SECRET` (minst 32 tecken)
- [ ] Använd environment variables istället för hårdkodade värden
- [ ] Aktivera SSL/TLS för databas
- [ ] Använd secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
- [ ] Begränsa nätverksåtkomst till databas/Redis
- [ ] Aktivera rate limiting
- [ ] Logga och övervaka alla API-anrop

### Rekommenderade Verktyg

**För lokalt:**
- [dotenv-vault](https://www.dotenv.org/docs/security/env-vault) - Krypterad .env
- [direnv](https://direnv.net/) - Auto-load environment per directory

**För production:**
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Azure Key Vault](https://azure.microsoft.com/en-us/products/key-vault/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## 🧪 Testing Environment

Skapa `.env.test` för testing:
```env
DATABASE_URL="mysql://root:password@localhost:3306/crm_db_test"
NODE_ENV="test"
```

## 📝 Environment Priority

Next.js laddar environment variables i denna ordning (senare overridar tidigare):

1. `.env` - Alla miljöer
2. `.env.local` - Alla miljöer (gitignored)
3. `.env.development` - Development endast
4. `.env.development.local` - Development endast (gitignored)
5. `.env.production` - Production endast
6. `.env.production.local` - Production endast (gitignored)
7. Environment variables från shell/Docker

## 🔍 Debugging

### Verifiera environment variables
```bash
# I Docker container
docker compose exec app env | grep DATABASE_URL

# Lokalt
node -e "console.log(process.env.DATABASE_URL)"
```

### Testa databas-anslutning
```bash
# Med Prisma
npx prisma db push

# Direkt med MySQL client
mysql -h localhost -u crm_user -pcrm_password crm_db
```

### Testa Redis-anslutning
```bash
# Lokalt
redis-cli ping

# Med password
redis-cli -a your_password ping

# I Docker
docker compose exec redis redis-cli -a redis_dev ping
```

## 📚 Mer Information

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Environment Variables](https://www.prisma.io/docs/guides/development-environment/environment-variables)
- [NextAuth Configuration](https://next-auth.js.org/configuration/options)
