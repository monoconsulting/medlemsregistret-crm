@echo off
cd /d "%~dp0\..\..\.."
echo Starting Askersund web scraper (Actor Smartbook platform)...
echo.
npx tsx scraping/scripts/askersund_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/json/
pause
