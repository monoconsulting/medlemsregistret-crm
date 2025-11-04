@echo off
cd /d "%~dp0\..\..\.."
echo Starting Laholm web scraper (FRI platform)...
echo.
npx tsx scraping/scripts/laholm_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause