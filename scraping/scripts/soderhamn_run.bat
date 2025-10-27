@echo off
cd /d "E:\projects\CRM"
npx tsx scraping/scripts/soderhamn_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
