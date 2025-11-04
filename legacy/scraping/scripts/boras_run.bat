@echo off
cd /d "e:\projects\CRM"
echo Running Borås scraper...
npx tsx scraping/scripts/boras_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
