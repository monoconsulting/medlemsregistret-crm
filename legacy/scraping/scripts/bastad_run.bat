@echo off
cd /d "%~dp0\..\..\.."
echo Running Bastad scraper...
npx tsx scraping/scripts/bastad_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
