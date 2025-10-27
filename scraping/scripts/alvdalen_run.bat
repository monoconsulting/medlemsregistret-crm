@echo off
cd /d "%~dp0\..\..\.."
echo Starting Alvdalen web scraper (Actor Smartbook platform)...
echo.
npx tsx scraping/scripts/alvdalen_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
