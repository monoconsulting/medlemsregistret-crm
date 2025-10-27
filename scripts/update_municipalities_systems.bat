@echo off
echo ========================================
echo Uppdaterar kommunsystem från CSV
echo ========================================
cd /d "e:\projects\CRM\crm-app"
npm run db:update-municipalities-systems
echo.
echo Tryck på valfri tangent för att fortsätta...
pause >nul