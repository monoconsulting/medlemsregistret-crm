# Important info:
- Never use mock data
- Never put in placeholders - we only work with real data
- NEVER change any ports
- Never use SQLLITE
- Don't finish your work before you have verified that it is working. Are you 100% sure?!


#Ports and technical details
**You are not allowed to change any of these values without permission:**
COMPOSE_PROJECT_NAME_PROD=crm-members-prod
COMPOSE_PROJECT_NAME_DEV=crm-members-dev
CRM_NETWORK_NAME=crm-network

# MySQL
MYSQL_IMAGE=mysql:8.0
MYSQL_ROOT_PASSWORD=root_password_change_me
MYSQL_DATABASE=crm_db
MYSQL_USER=crm_user
MYSQL_PASSWORD_PROD=crm_password_change_me
MYSQL_PASSWORD_DEV=crm_password
MYSQL_PORT_PROD=3316
MYSQL_PORT_DEV=3326
MYSQL_TIMEZONE=Europe/Stockholm

# phpMyAdmin
PHPMYADMIN_PORT_PROD=8170
PHPMYADMIN_PORT_DEV=8270

# Redis
REDIS_IMAGE=redis:7-alpine
REDIS_PASSWORD_PROD=redis_password_change_me
REDIS_PASSWORD_DEV=redis_dev
REDIS_PORT_PROD=6179
REDIS_PORT_DEV=6279

# Application
APP_PORT_PROD=3010
APP_PORT_DEV=3020
NODE_ENV_PROD=production
NODE_ENV_DEV=development
NEXT_PUBLIC_APP_URL_PROD=http://localhost:3010
NEXT_PUBLIC_APP_URL_DEV=http://localhost:3020
NEXTAUTH_URL_PROD=http://localhost:3010
NEXTAUTH_URL_DEV=http://localhost:3020
NEXTAUTH_SECRET_PROD=change_me_to_random_string_in_production
NEXTAUTH_SECRET_DEV=dev_secret_change_in_production
APP_TIMEZONE=Europe/Stockholm

# Local tooling (Prisma etc.)
DATABASE_URL=mysql://${MYSQL_USER}:${MYSQL_PASSWORD_DEV}@localhost:${MYSQL_PORT_DEV}/${MYSQL_DATABASE}