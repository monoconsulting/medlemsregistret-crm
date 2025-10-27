@echo off
cd /d "e:\projects\CRM"
echo Running Boras API scraper...
npx tsx scraping/scripts/boras_api_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
