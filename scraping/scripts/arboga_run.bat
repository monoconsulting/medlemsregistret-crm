@echo off
cd /d "%~dp0\..\..\.."
echo Starting Arboga web scraper (FRI platform)...
echo.
npx tsx scraping/scripts/arboga_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause