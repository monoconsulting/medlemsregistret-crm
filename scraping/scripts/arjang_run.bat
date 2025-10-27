@echo off
cd /d "%~dp0\..\..\.."
echo Running Arjang FRI scraper...
npx tsx scraping/scripts/arjang_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
