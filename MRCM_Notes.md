# MCRM - NOTES

## Sidlayout

### Kommunöversikt

Fördelning: Vänster kolumn 80%, Höger kolumn 20&

Vänster kolumn;: Tabell med följande kolumner

* Kommun: Municipality.name 

* Kommunkod - Municipality.code
* Län - Municipality.county
* Länskod - Municipality.countyCode
* Region - Municipality.region
* Landskap - Municipality.province
* Importstatus - Municipality.registerStatus
* Befolkning - Municipality.population
* Hemsida - Municipality.homepage OBS! SAKNAS! Importera detta från filen /temp/Foreningar3.csv. Skapa även schema.
* Plattform - Municipality.platform

**Höger kolumn:**

* Redigerbara detaljer om kommun. Vid redigering uppdateras tabellen. Nedan ska vara redigerbart:
  * Population
  * Kommunens föreningsregister (länk) Municipality.registerUrl
* Karta som visar position



### Föreningar

* Kolumn 1 ska vara kommunen de tillhör. 

* Kolumn 2 - behåll "Förening" - men den ska vara klickbara och öppna modal för redigering

* Kolumn 3 - behåll "Status" -  men gör denna badge klickbar så att den öppnar en dropdown med befintliga statusar

* Kolumn 4 - behåll "Pipeline" - men gör denna badge klickbar så att den öppnar en dropdown med befintliga alternativ

  Kolumn 5 - behåll. Klickbar - ska öppna upp redigeringsmodal med enbart kontaktuppgifter. Man ska här kunna lägga till fler kontakter. Det ska finnas en primär kontakt

  Ta bort kolumn adress, ta bort kolumn ansvarig

  Kolumn 6 - NY KOLUMN - Föreningstyp - Association.types

  Kolumn 7 - NY KOLUMN - Taggar - Association.activities

  Vi behöver ha de taggar som finns listade per förening

* Vid klick på föreningsnamnet (i bold) så ska stor modal öppnas för redigering 80% av skärmyta centrerad

  * Alla uppgifter som finns i tabellen Association ska skrivas ut här. Var noga med att göra tabeller av multitabellskolumnerna. 
  * Det ska stå vilken kommun föreningen tillhör
  * Längst ner ska man kunna skriva noteringar med timestamp som sparas på den aktuella föreningen

* On mouse over på penna "Redigera förening" - peka till samma modul som länken i "Förening" pekar till. 

* On mouse over på personen "Kontakter" - ska visa föreningens kontaktadresser, organisationsnummer, samt kontaktpersoner med fulla uppgifter

* On mouse over på email - "Skicka epost" öppnar formulär för epost till de kontaktadresser som finns för föreningen

* SKAPA NY IKON MED LITET HUS - skickar vidare till föreningens hemsida



## Taggar

Föreningar ska per automatik bli taggade beroende på verksamhet. Här ska man vid inläsning se om det finns befintliga taggar som passar och applicera dessa, man ska också spara dessa, och hämta andra liknande som passar och lägga till i tabellen. Administratörer kan själva lägga till taggar. 

Actions:  

### Hantera npm

1. npm install (om du inte redan har node_modules).
2. npx prisma generate (efter schemaändringar).
3. npm run lint – ger samma ESLint/tsc-check som i Docker.
   1. npm run build – motsvarar next build och kommer att falla på exakt samma ställe som lagret [builder 5/5] RUN npm run build.



# ÖNSKELISTA

Sätt larm för viss aktivitet



### Definition scraping

1. Definierade scrapingskript sparas i mapp /scraping/scripts och heter kommun_scrape.ts
2. Då skriptet körs skapas en jsonfil i mappen /scraping/json och datan sätts in omgående i databasen
3. Alla befintliga skript kan ses och köras från Menyval "Web-scraping" i systemet. Där skapas en lista över alla kommuner. Man ska ha möjliget att göra följande: 
   1. en ny scrape som uppdaterar eller ersätter befintlig, scraping. Man ska kunna välja att köra flera eller alla kommuner för att scrapea igen.
   2. En länk för att öppna json-koden i en modal. möjligheter ska finnas att redigera denna.
   3. Möjlihet att öppna historiska json-filer 
4. JSON ska sparas i endast ett format - fullständigt alltså inte bara en linje i katalogen /scraping/json
5. Instruktioner för scraping ska finnas i katalogen /scraping/docs



Gör en plan för hur jag kan implementera detta, och fråga om något saknas