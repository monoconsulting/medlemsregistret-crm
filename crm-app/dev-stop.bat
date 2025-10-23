@echo off
echo Stopping CRM Development Environment...
docker compose -f docker-compose.dev.yml down
echo Services stopped.
pause
