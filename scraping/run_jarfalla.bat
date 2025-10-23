@echo off
cd /d "%~dp0\.."
npx tsx scraping/jarfalla_scrape.ts
pause
