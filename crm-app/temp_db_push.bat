@echo off
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db
npx prisma db push
