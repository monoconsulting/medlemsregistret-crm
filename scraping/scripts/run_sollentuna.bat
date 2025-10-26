@echo off
REM Run Sollentuna Association Registry Scraper

echo ========================================
echo Sollentuna Association Registry Scraper
echo ========================================
echo.
echo Starting scrape of Sollentuna municipality...
echo Base URL: https://boka.sollentuna.se/forening/
echo.
echo This will:
echo  - Scrape all pages of the association registry
echo  - Visit each association's detail page
echo  - Extract contact information and metadata
echo  - Save results to scraping/out/
echo.
echo Press Ctrl+C to cancel, or
pause

npx tsx scraping/sollentuna_scrape.ts

echo.
echo ========================================
echo Scrape completed!
echo Check scraping/out/ for results:
echo  - JSONL file (one record per line)
echo  - Pretty JSON file (formatted)
echo  - Log file (execution details)
echo ========================================
pause
