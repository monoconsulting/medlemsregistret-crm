@echo off
cd /d "%~dp0\..\..\.."
echo Running Karlstad association registry scraper...
npx tsx scraping/scripts/karlstad_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
