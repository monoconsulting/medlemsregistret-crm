@echo off
cd /d "%~dp0\..\..\.."
echo Starting Bromölla web scraper (FRI platform)...
echo.
npx tsx scraping/scripts/bromolla_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause