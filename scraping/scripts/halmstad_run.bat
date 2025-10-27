@echo off
cd /d "%~dp0\..\..\.."
REM Run Halmstad Association Registry Scraper

echo ========================================
echo Halmstad Association Registry Scraper
echo ========================================
echo.
echo Starting scrape of Halmstad municipality...
echo Base URL: https://fri.halmstad.se/forening/
echo.
echo This will:
echo  - Scrape all pages of the association registry
echo  - Visit each association's detail page
echo  - Extract contact information and metadata
echo  - Save results to scraping/json/
echo.
echo Press Ctrl+C to cancel, or
pause

npx tsx scraping/scripts/halmstad_scrape.ts

echo.
echo ========================================
echo Scrape completed!
echo Check scraping/json/ for results:
echo  - JSONL file (one record per line)
echo  - Pretty JSON file (formatted)
echo  - Log file (execution details)
echo ========================================
pause
