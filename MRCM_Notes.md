# MCRM - NOTES

Nu:

Karta: Sätt örebro i mitten av kartan då funktionen startar. Annars kan vi hamna på en annan kontinent



## Övrigt

- [ ] 

## Kommuner

- [ ] Möjlighet att markera kommuner och därefter skapa grupp
- [ ] Möjlighet att gruppera kommuner
- [x] Sortera genom klick på headern
- [x] Fixa encodingproblemet på Föreningar
- [x] Gör följande i kommuntabellen sorteringsbart:
  - [x] Kommun
  - [x] Län
  - [x] Region
  - [x] Landskap
  - [x] Befolkning
  - [x] Föreningar
  - [x] Plattform

## Föreningar

- [ ] Möjlighet att välja kommun. Dropdown finns - men den är tom. Jag vill kunna välja bland alla kommuner och skriva in texten längst uppe så den kan söka istället för att man rullar.

- [ ] Vanlig Sökning fortfarande inte fungerande
- [ ] Väldigt långsamt behöver indexeras

### Övrigt

- [ ] Fixa tabeller för status och pipeline
- [ ] AI-genererat taggande

@start.prompt.md 

Jag vill att du skapar ett nytt menyalternativ "Användare". Här ska man ha möjlighet att skapa och administrera personer som ska jobba i systemet. Basera den på innehållet i databasen och gör ett fullständigt admininterface som följer de standards som finns i designen.



Torrsim



























```
### Kommunöversikt: 

Kolumn kommun: Vid klick på kommunen ska man öppna menyval "Föreningar" och visa upp samtliga föreningar som tillhör kommunen i bokstavsordning.
```



Läs AGENTS.md.

Skapa först en featurebranch för detta. Därefter:

Vi behöver skapa ett nytt skript för hantering av

Följande korrigeringar behöver göras:

## Municipalities - Kommunöversikt

1. Om man klickar på kommun så vill jag att man hoppar över till "Föreningar" och där endast visar det som tillhör aktuell kommun.
2. Sätt utgångspunkt för kartan till Örebro län - https://maps.app.goo.gl/LN7XSDF3fjRwNiBY9xc

* #### Huvudmodalen i föreningar (när man klickar på föreningsnamnet)

* Inga fält kan redigeras i modalen

* Lägg till all information från Association.description. Se till att det presenteras i tabellform

*  Lägg till all information från Association.extras. Se till att det presenteras i tabellform

* Lägg till descriptionFreeText 

* Status och pipeline ska se ut exakt som i tabellen på huvudsidan för föreningar. Man klickar och väljer.

* 



Nu:



## Kommunsida

* Karta. Centrera kommunen mitt i bilden vid start, och zooma ut. Målet är att sverige ska synas på bredden, så både höger och vänster sida är så nära gränsen det går





## Föreningssida

### Modal

#### Ska kunna redigeras:

* Organisationsnummer

* Email - finns i tabellen men saknas i listan

* Primär kontakt

* Adress

* Taggar - här ska man kunna söka i taggtabellen med json och lägga till hur många som helst

* Aktiviteter - slå ihop med taggar. Här ska man börja skriva och sedan kan man välja av det som kommer upp en eller flera
* Byt namn till Ytterlig information till Övrig information

- Modal för liten - Metadata sticker ut
- Modal: Tasks: Lägg till i modalen möjlighet att skapa tasks
- Modal: Grupper: Lägg möjlighet att lägga till i en eller flera grupper. Ska gå från både tabellen och modalen.
- Modal: Ta bort rutan metadata. Skapa istället en ny sida där alla händelser som finns är registrerade på ett smart sätt från import till framåt. Kan man ha yttterligare en modal så ska vi ha det. 
- Källsystem saknas (ex FRI)
- Description saknas helt
- founded_year - Bildad år
- verksamhet_raw - Taggar
- short_description - Kort beskrivning
- fiscal_year_starts: år startar
- free_text: Fritext
- mobile: mobiltelefon
- Ta bort detaljsida och lägg primär kontakt där under istället.
- Fältet ytterligare information:
  - Byt namn till "Övrig information"
  - api_id - ta bort
  - mobile=Mobiltelefon: 
  - disctrict_names = Distrikt
  - national_affiliation = Riksorganisation
  - 







| Fält                  | Värde         |
| :-------------------- | :------------ |
| api_id                | 313           |
| mobile                | 070-213 10 88 |
| district_names        | Färila        |
| occupations_raw       |               |
| leisure_activity_card | false         |



Skickat till Codex

* ```
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
  ```

  



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

Epost

Epostadresser måste hanteras.

Footer måste kunna sättas in





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