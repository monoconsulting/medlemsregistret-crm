@echo off
cd /d "%~dp0\..\..\.."
npx tsx scraping/scripts/jarfalla_scrape.ts
pause
