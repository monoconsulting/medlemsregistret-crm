@echo off
echo Starting Alvdalen web scraper (Actor Smartbook platform)...
echo.
npx tsx scraping/alvdalen_scrape.ts
echo.
echo Scrape complete. Check the output files in scraping/out/
pause
