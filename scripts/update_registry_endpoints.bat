@echo off
echo ========================================
echo Uppdaterar registry endpoints
echo ========================================
cd /d "e:\projects\CRM\crm-app"
npm run db:update-registry-endpoints
echo.
echo Tryck på valfri tangent för att fortsätta...
pause >nul