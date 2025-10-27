@echo off
echo ========================================
echo Verifierar registry endpoints
echo ========================================
cd /d "e:\projects\CRM\crm-app"
npm run db:verify-registry-endpoints
echo.
echo Tryck på valfri tangent för att fortsätta...
pause >nul