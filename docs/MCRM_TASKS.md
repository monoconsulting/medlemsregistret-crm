# ACTIONS

### Kommuner

- [ ] Tom



### Föreningar

- [ ] Om man trycker på föreningens namn så ska man länkas till föreningens hemsida om sådan finns. Finns den inte så ska ingen länk finnas
- [x] Vid klick där länk till annat saknas på hela raden så ska huvudmodalen öppnas
- [x] Skriv antal förvalda föreningar (100) i dropdown man väljer antal rader i listan
- [ ] Då man går ur modalen ska den aktuella posten omedelbart uppdateras i föreningstabellen
- [ ] Sätt 



### Föreningar - Huvudmodal

- [ ] Lägg fältet Anteckningar längst ner till höger

- [ ] Gör alla URL:er klickbara url på "Detalj-url", "Hemsida"

- [ ] Flytta fältet "KONTAKTER" och lägg det direkt under Adress

- [ ] Gör fältet längst uppe under föreningens titel "1 Kontakter" klickbart så att man kommer till kontaktmodalen.

- [ ] Implementera kontaktmodalen från 

   E:\projects\CRM\legacy\crm-app\components\modals\edit-contact-modal.tsx

​	E:\projects\CRM\legacy\crm-app\components\modals\add-contact-modal.tsx

Detta ska kunna aktiveras från: Föreningstabell - kontaktikon, Huvudmodal - Kontakter (längst uppe), Kontaktfältet i huvudmodalen

- [ ] Implementera skicka epost från E:\projects\CRM\legacy\crm-app\components\modals\send-email-modal.tsx och lägg en epostlänk under åtgärder, samt länk till denna i huvudmodalen, och grupperingar - på kortet



## Kontakter

Börja med att läsa @/.prompts/start.prompt.md

**Context**

Hanteringen av kontakter håller på att uppdateras och det har varit mycket problem med detta under resans gång. 

Som start så vill jag att du återigen läser igenom de senaste 3 dagarnas worklogs i katalogen @/docs/worklogs

Dessa innehåller väldigt mycket information du kommer ha nytta av.

## Ditt uppdrag:

### Under Huvudmeny -> kontakter:

Här ska en lista finnas med samtliga systemets kontakter listade sorterat per namn. 

- [ ] Alla headers i listan ska vara sorterbara
- [ ] Sidan ska default visa 100 kontakter, men man ska kunna ställa in 25, 50, 100, 250, 500 
- [ ] Sidan ska längst ner ha bläddringsfunktionalitet på samma sätt som Föreningssidan
- [ ] Kolumner från vänster till höger: Checkbox - Namn - Förening - Kommun - Primär kontakt (ja/nej) - Adress - Telefonnummer - Epost - Facebook - Instagram - Twitter - Åtgärder (Penna för stora kontaktmodalen, papperskorg för soft delete)

#### Kontakter - Huvudmodal

- [ ] Då man klickar på kontakten i listan på ett ställe som saknar länk, eller på pennan ska den stora kontaktmodalen per förening öppnas. Denna ska täcka 80 procent av sidan i storlek

- [ ] I modalen ska den övre halvan utgöra en lista - exakt samma som ovan - där alla kontakter **som tillhör föreningen** listas. Klickar man på en kontakt på raden här så öppnas den i nedre halvan

I nedre halvan så ska följande information finnas (förutom allt ovan)

- [ ] Knapp för AI-sökning på sociala medier
- [ ] Ruta för övriga anteckningar
- [ ] Anteckningar specifikt för kontakt (exakt samma upplägg som i Föreningssidans huvudmodal) på högersidan. Liknande blogpost-kommentarer. 
- [ ] 

#### Kontakter - Lägg till kontakt

- [ ] Ska öppna en huvudmodal för kontakter där ingen är vald och man själv fyller i information för ny kontakt och denna kopplas sedan till vald förening



Implementeras enligt:

**Föreningar huvudmodal**

- [ ] Längst uppe under föreningens titel står det N kontakter. Klickar man där ska Kontakt Huvudmodal komma upp
- [ ] Kontakter till höger i föreningssidans huvudmodal - klickar man där så ska man kunna lägga till samt redigera (samma modal - men lägg till saknar ifyllda uppgifter)
- [ ]  Knappen för kontakter längst ute till höger på föreningssidan - länkar till kontaktmodalen med samtliga kontakter listade och den primära kontakten vald

### Summering

Läs de dokument du är instruerad att göra. 

Därefter analysera den befintliga koden gällande detta. Vissa delar saknas. 

Nuvarande fel är Database query failed. Log bifogad längst ner.

Kolla att samtliga kolumner finns på plats - och att de anropas på rätt sätt. Detta har varit ett återkommande problem.

Slutligen:
Ta fram en detaljerad plan och ett förslag hur detta kan införas på ett sätt som är framgångsrikt och säker. 

Då jag godkänt kör vi.



Börja med att läsa @/.prompts/start.prompt.md

**Problem**



**Ditt uppdrag**

- [ ] Task
- [ ] Task
- [ ] Task
- [ ] Task

**Ditt uppdrag**

- [ ] Task
- [ ] Task
- [ ] Task
- [ ] Task

## Grupperingar

Börja med att läsa @/.prompts/start.prompt.md

**Context**



**Ditt uppdrag**

- [ ] Task
- [ ] Task
- [ ] Task
- [ ] Task



## Taggar



## Loggar



## Användarhantering

# Klara Actions

### Kommuner

- [x] Lägg till checkbox Visa endast valda kommuner











## TAGGAR

## Läs först @.prompts/start.prompt.md

## Ditt uppdrag

### Start:

Läs @.prompts\start.prompt.md . 

Läs worklog skriven med gårdagens datum @docs\worklogs\25-11-10_Worklog.md 

## Ditt uppdrag

### Taggar

Taggar är en ytterst central del i systemet. Vi behöver skapa en funktion som då den anropas kör ett skript som kan exekveras antingen för varje förening (från huvudmodalen) - eller för samtliga föreningar.

Följande ska då göras: 

1. Genomgång av följande fält i Assocationtabellen:
   * types
   * activities
   * categories 



Nu ska vi titta lite på taggar. Dessa är centrala och används för att utöka systemet sökfunktionalitet.

Tidigare är ett skript byggt /script/populate_tags.bat som gör en bra baseline för hantering av taggar.  Jag vill att vi utgår ifrån detta skript och bygger vidare på det enligt följande: 

1. **Backup** tas först med dbbackup_full.bat

2. Skriptet ska köras på **loopiadatabasen**

3. **Idempotens / Inkrementellt läge**

   - Körningar ska inte kräva att **Tag** är tom.
   - Upsert på Tag + på pivot, och undvik dubbletter.

   **Dry-run & rapport**

   - Flagga för ”plan” (visa *vad* som skulle ändras) + summering: *nya taggar*, *nya länkar*, *berörda föreningar*.
   - Exportera en enkel CSV/MD-rapport efter körning och skapa en länk till rapporten som ska kunna ses i guit

   **Proveniens**

   - Sätt `source='db:field'` (skapa en metadata-tabell/logg) så vi kan särskilja baslinje-taggar från kommande AI-taggar (`ai:web`) senare.

   **Taxonomi-guardrails**

   - Skapa en en central ordlista (alias → kanoniskt taggnamn) för att undvika stavningsvarianter.

   **Felhantering & återhämtning**

   - Tydlig exit-kod på fel, loggfil, samt möjlighet att återuppta från senast lyckad batch.

   **Roll-out i UI**

   - Lägg till ett nytt menyval "Taggar" och i denna skapa olika tabbar. Under tab "Generera nya taggar" skapa en knapp ”Generera baslinje-taggar” som anropar en server-endpoint som kör motsvarande logik (samma regler, samma rapport).

   

Gå igenom kodbasen och filerna associerade till populate_tags.bat. 



Du ska ytterst noggrant implementera följande funktionalitet. Du ska säkerställa att detta är kopplat till databasen, att data populeras och sparas då man redigerar.

Context:

Sökfunktionen är en central del i portalens funktion. Idag funderar inte sökningen alls - om jag skriver några bokstäver i sökrutan nollställs allt ganska omgående. Följande kod genereras i inspector: 

```
07:05:20,915 GET
https://crm.medlemsregistret.se/associations
[HTTP/2 301  13ms]

07:05:21,016 GET
https://crm.medlemsregistret.se/associations/
[HTTP/2 200  14ms]

07:05:21,048 GET
https://crm.medlemsregistret.se/_next/static/css/baee91829c5c5692.css
[HTTP/2 200 OK 0ms]

07:05:21,149 GET
https://crm.medlemsregistret.se/_next/static/chunks/webpack-eb82c0a1ea19074a.js
[HTTP/2 200  0ms]

07:05:21,151 GET
https://crm.medlemsregistret.se/_next/static/chunks/4bd1b696-13d3d0bd5b7dfac5.js
[HTTP/2 200  0ms]

07:05:21,159 GET
https://crm.medlemsregistret.se/_next/static/chunks/517-00485b2e06c434e0.js
[HTTP/2 200  0ms]

07:05:21,161 GET
https://crm.medlemsregistret.se/_next/static/chunks/main-app-993b53bc533231c4.js
[HTTP/2 200  0ms]

07:05:21,163 GET
https://crm.medlemsregistret.se/_next/static/chunks/114-79f0e5e7f28ff723.js
[HTTP/2 200  0ms]

07:05:21,164 GET
https://crm.medlemsregistret.se/_next/static/chunks/699-c980fbc222dcad8d.js
[HTTP/2 200  0ms]

07:05:21,165 GET
https://crm.medlemsregistret.se/_next/static/chunks/161-1e407a106cd8d5fd.js
[HTTP/2 200  0ms]

07:05:21,166 GET
https://crm.medlemsregistret.se/_next/static/chunks/436-95966bb0a19748ba.js
[HTTP/2 200  0ms]

07:05:21,167 GET
https://crm.medlemsregistret.se/_next/static/chunks/app/layout-c65b1489c9e16341.js
[HTTP/2 200  0ms]

07:05:21,176 GET
https://crm.medlemsregistret.se/_next/static/chunks/0e5ce63c-e4d55166c80d5010.js
[HTTP/2 200  0ms]

07:05:21,178 GET
https://crm.medlemsregistret.se/_next/static/chunks/28-b1b59ddc6f8bb559.js
[HTTP/2 200  0ms]

07:05:21,180 GET
https://crm.medlemsregistret.se/_next/static/chunks/750-707cbc0753401ae3.js
[HTTP/2 200  0ms]

07:05:21,182 GET
https://crm.medlemsregistret.se/_next/static/chunks/308-13e3b7b2cccbe304.js
[HTTP/2 200  0ms]

07:05:21,191 GET
https://crm.medlemsregistret.se/_next/static/chunks/227-3f268497beb2cb42.js
[HTTP/2 200  0ms]

07:05:21,192 GET
https://crm.medlemsregistret.se/_next/static/chunks/465-f6494172315efa51.js
[HTTP/2 200  0ms]

07:05:21,195 GET
https://crm.medlemsregistret.se/_next/static/chunks/355-125d322820fbca39.js
[HTTP/2 200  0ms]

07:05:21,196 GET
https://crm.medlemsregistret.se/_next/static/chunks/44-782dbbeec3a9bb2b.js
[HTTP/2 200  0ms]

07:05:21,203 GET
https://crm.medlemsregistret.se/_next/static/chunks/685-9657185dba42e657.js
[HTTP/2 200  0ms]

07:05:21,204 GET
https://crm.medlemsregistret.se/_next/static/chunks/705-d0231fbdea3b204f.js
[HTTP/2 200  0ms]

07:05:21,207 GET
https://crm.medlemsregistret.se/_next/static/chunks/app/associations/page-283fa0d44d15001a.js
[HTTP/2 200  0ms]

07:05:21,323 GET
https://crm.medlemsregistret.se/_next/static/chunks/webpack-eb82c0a1ea19074a.js
[HTTP/2 200  0ms]

07:05:21,326 GET
https://crm.medlemsregistret.se/_next/static/chunks/4bd1b696-13d3d0bd5b7dfac5.js
[HTTP/2 200  0ms]

07:05:21,330 GET
https://crm.medlemsregistret.se/_next/static/chunks/517-00485b2e06c434e0.js
[HTTP/2 200  0ms]

07:05:21,333 GET
https://crm.medlemsregistret.se/_next/static/chunks/114-79f0e5e7f28ff723.js
[HTTP/2 200  0ms]

07:05:21,334 GET
https://crm.medlemsregistret.se/_next/static/chunks/699-c980fbc222dcad8d.js
[HTTP/2 200  0ms]

07:05:21,335 GET
https://crm.medlemsregistret.se/_next/static/chunks/161-1e407a106cd8d5fd.js
[HTTP/2 200  0ms]

07:05:21,336 GET
https://crm.medlemsregistret.se/_next/static/chunks/436-95966bb0a19748ba.js
[HTTP/2 200  0ms]

07:05:21,337 GET
https://crm.medlemsregistret.se/_next/static/chunks/app/layout-c65b1489c9e16341.js
[HTTP/2 200  0ms]

07:05:21,338 GET
https://crm.medlemsregistret.se/_next/static/chunks/28-b1b59ddc6f8bb559.js
[HTTP/2 200  0ms]

07:05:21,339 GET
https://crm.medlemsregistret.se/_next/static/chunks/750-707cbc0753401ae3.js
[HTTP/2 200  0ms]

07:05:21,341 GET
https://crm.medlemsregistret.se/_next/static/chunks/308-13e3b7b2cccbe304.js
[HTTP/2 200  0ms]

07:05:21,344 GET
https://crm.medlemsregistret.se/_next/static/chunks/227-3f268497beb2cb42.js
[HTTP/2 200  0ms]

07:05:21,346 GET
https://crm.medlemsregistret.se/_next/static/chunks/465-f6494172315efa51.js
[HTTP/2 200  0ms]

07:05:21,347 GET
https://crm.medlemsregistret.se/_next/static/chunks/44-782dbbeec3a9bb2b.js
[HTTP/2 200  0ms]

07:05:21,347 GET
https://crm.medlemsregistret.se/_next/static/chunks/355-125d322820fbca39.js
[HTTP/2 200  0ms]

07:05:21,349 GET
https://crm.medlemsregistret.se/_next/static/chunks/685-9657185dba42e657.js
[HTTP/2 200  0ms]

07:05:21,351 GET
https://crm.medlemsregistret.se/_next/static/chunks/705-d0231fbdea3b204f.js
[HTTP/2 200  0ms]

07:05:21,352 GET
https://crm.medlemsregistret.se/_next/static/chunks/app/associations/page-283fa0d44d15001a.js
[HTTP/2 200  0ms]

07:05:21,687 GET
https://crm.medlemsregistret.se/favicon.ico
[HTTP/2 404  0ms]

07:05:21,693 XHRGET
https://crm.medlemsregistret.se/api/auth/me.php
[HTTP/2 200  21ms]

07:05:21,717 XHRGET
https://crm.medlemsregistret.se/api/associations.php?page=1&pageSize=20&sort=updated_desc
[HTTP/2 200  609ms]

07:05:21,720 XHRGET
https://crm.medlemsregistret.se/api/municipalities.php
[HTTP/2 200  661ms]

07:05:21,722 XHRGET
https://crm.medlemsregistret.se/api/tags.php
[HTTP/2 200  670ms]

07:05:21,726 POST
https://crm.medlemsregistret.se/api/log.php
[HTTP/2 200  671ms]

07:05:21,728 POST
https://crm.medlemsregistret.se/api/log.php
[HTTP/2 200  681ms]

07:05:21,743 XHRGET
https://crm.medlemsregistret.se/dashboard.txt?_rsc=1ry2i
[HTTP/2 404  3ms]

07:05:21,744 XHRGET
https://crm.medlemsregistret.se/municipalities.txt?_rsc=1ry2i
[HTTP/2 404  5ms]

07:05:21,745 XHRGET
https://crm.medlemsregistret.se/associations.txt?_rsc=1ry2i
[HTTP/2 404  5ms]

07:05:21,746 XHRGET
https://crm.medlemsregistret.se/contacts.txt?_rsc=1ry2i
[HTTP/2 404  5ms]

07:05:21,747 XHRGET
https://crm.medlemsregistret.se/groups.txt?_rsc=1ry2i
[HTTP/2 404  5ms]

07:05:21,818 POST
https://crm.medlemsregistret.se/api/log.php
[HTTP/2 200  596ms]

07:05:21,847 XHRGET
https://crm.medlemsregistret.se/users.txt?_rsc=1ry2i
[HTTP/2 404  3ms]

07:05:21,848 XHRGET
https://crm.medlemsregistret.se/import.txt?_rsc=1ry2i
[HTTP/2 404  3ms]


```



Sökning ska generera svar samtidigt som man skriver. 

Sökning ska genomföras i följande fält ur databasen:

Tabell: Association

name, municipality, city, description, descriptionFreeText, extras, types, activities

Menyn som heter grupperingar - /groups - fungerar inte som den ska. 

Där ska följande ske:

1. I första vyn så ska alla grupperingar listas i kortformat. Detta fungerar
2. Om man trycker på "Öppna grupp" så ska man få detaljer för grupperingen och kunna redigera osv. Detta fungerar inte alls utan studsar bara tillbaka till /groups igen. 





- [ ] Taggar verkar inte listas i tabellen - dessa ska hämtas från_AssociationTags
- [ ] Då mer än en förening har checkbox märkt ska en knapp dyka upp överst till höger på tabellen med texten gruppera. Modalen för att skapa grupp ska då komma upp. Hämta modalen och se till att den är identisk och har full funktion: E:\projects\CRM\legacy\crm-app\components\modals\add-associations-to-group-modal.tsx. 
- [ ] I edit-association - stora modalen - lägg till modale add-contact-modal och edit-contact-modal. Lägg också till association-contacts-modal. Se till att samtliga är korrekt kopplade mot databasen.
- [ ] Från stora edit-association-modalen ska man kunna skicka mail. Lägg till send-email-modal till den modalen.
- [ ] 

- [x] Sorteringsfunktionalitet saknas - man ska kunna klicka på en kolumn för att sortera upp eller ner på den kolumnen.
- [x] Checkboxar längst till vänster i listan över föreningar saknas

### Ditt uppdrag:

+ Att analysera association-sidans befintliga tagg-metodik

+ Att koppla och visa korrekta taggar för varje förening i huvudtabellen med badges

+ Att ge möjlighet att i huvudmodalen kunna lägga till eller ta bort taggar i fältet "TAGGAR" enligt följande funktionalitet:

  	- Dropdown med sökfunktionalitet och ajaxliknande interface där du kan börja skriva för att söka taggar. Exempel S - alla på S, k, alla på Sk osv Skoter ska då ge Skoter, skoterklubb etc. Man ska då kunna välja taggar utifrån detta
   - Man ska också - om tagg saknas kunna lägga till en tag som ska sparas i tag-tabellen och associeras till föreningen
     Man ska kunna ta bort en förenings tagg om man vill, och lägga till fler.

  

  Att skapa en omfattande plan utifrån denna analys

+ Att säkerställa full funktionalitet i dessa



## Context

- På föreningssidan (associations) finns ett antal modaler implementerade - men detta är slarvigt genomfört varför vi nu måste säkerställa funktionalitet i alla modalers respekitve fält
- Gå igenom varje modal. Testa varje fält, verifiera att data sparas och att data uppdateras.
- Då din implementation är klar ber du mig bygga om
- Därefter gör du test med filen @web\tests\crm-kommuner-foreningar.spec.ts. 

Ditt uppdrag: samtliga modaler ovan ska fungera och kunna uppdatera databasen med relevant information.

**Har du några frågor till mig gällande ditt uppdrag?**









- Systemet jobbar mot en frontend som vi via ftp publicerar till ett webhotell hos leverantören loopia. 
- Systemet ska kopplas mot loopias databas. 
- Du finner information om detta i .env-filerna, docker compose, claude.md mm.
- Designen får under inga omständigheter ändras.
- Mockdata är absolut förbjuden och ska elimineras och ersättas med korrekt koppling mot databasen

## Ditt uppdrag

Designen har blivit uppdaterad - men n har vi istället två nya problem:

### Menyval Kommuner:

- Här saknas data helt. 
- Det verkar inte alls finnas någon koppling till databasen.
- Denna måste du koppla mot loopias databas
- Du ska sedan se data ifylld i samtliga kolumner och dropdowns, funktioner osv.1

Viktiga kolumner:

* Föreningsregister: Här ska **systemtyp **skrivas ut ( RBOK, FRI, etc) -  hämtas från Municipality.platform och **SKA LÄNKAS** till föreningsregistret Municipality.register.Url

* Kartan längst till höger MÅSTE fungera. Du SKA HÄMTA Municipality.longitude och Municipality.latitude. Orten ska vara **centrerad** på bilden. Granska bilden om orten ligger MITT I INDISKA OCEANEN så har du bytt plats på longitude och latitude
* Designen finns i kodbasen i /figma om du skulle fundera på den och på länken https://www.figma.com/make/KAtuDucijPTgOLMaNiN6Fc/CRM-System-Design-Proposal?node-id=0-1&p=f&t=9gYoedIGUjfFosqf-0&fullscreen=1 finns rätt design

### Menyval Föreningar

- Denna sida har havererat helt och det går inte att komma in på den alls
- Felsök vad detta beror på och därefter SÄKERSTÄLL ATT HELA SIDAN FUNGERAR SOM TÄNKT. Alla kolumner fält knappar och annat ska ha kopplingar mot databasen.

Då du är klar:
**Du SKA göra ett test och du MÅSTE använda denna codegen som jag vet fungerar och loggar in:**

E:\projects\CRM\web\codegen\crm.codegen.full.site.walktrhough.spec.ts

Du ska skapa ett test utifrån detta för att kontrollera:

1. Har Kommunerna rätt data??!
2. Fungerar Föreningssidan till 100%
3. **Du ska INTE GÖRA världens största och bästa test** - du ska BARA ta reda på detta.

### ACTIONS

1. Skapa testet och kör detta - ser du att Kommunerna saknar data och Föreningssidan är tom? Då är det rätt.
2. Åtgärda problemen som bekrevs
3. Kör testet igen
4. Iterera över detta tills samtliga problem är lösat.

**Till slut:**

Du får **ABSOLUT INTE** ändra testet så att det går igenom eller **FUSKA LJUGA ELLER FARA MED OSANNING.**

Du **SKA** lösa alla delar i denna uppgift.

**Ställ mig först frågor,** gör därefter en detaljerad **plan** och **task list ** att se till att detta fixar sig.





| Checkbox | Kommun      | Förening                   | Status | Pipeline    | Kontakt        | Föreningstyp | Taggar        | Uppdaterad |
| :------- | :---------- | :------------------------- | :----- | :---------- | :------------- | :----------- | :------------ | :--------- |
|          | Malmö       | Malmö Fotbollsklubb        | Aktiv  | Kontaktad   | Lars Andersson | Sport        | FotbollUngdom | 2025-11-03 |
|          | Lund        | Lunds Naturvänner          | Aktiv  | Lead        | Maria Svensson | Miljö        | NaturMiljö    | 2025-11-05 |
|          | Helsingborg | Helsingborg Teaterförening | Aktiv  | Förhandling | Erik Johansson | Kultur       | TeaterKultur  | 2025-11-01 |

- [ ] <- Checkbox: 

- Kommun

- Förening (Länk till föreningens hemsida)

- Status (om kund till medlemsregistret)

- Pipeline: Försäljjningsstatus

- Kontaktperson (Namn, Epost, Telefon. Om första person finns ta den annars ta den som finns)

- Föreningstyp (lista från föreningstyperna)

- Taggar

- Antal medlemmar

  

Kommun

Felaktig design

#### Kommunlista

Visar 10 av 10 kommuner

|      | Kommunnamn  | Kommunkod | Landskap      | Län                  | Länskod | Region                   | Befolkning | Antal föreningar | Aktiva föreningar | Föreningsregister                                  |
| :--- | :---------- | :-------- | :------------ | :------------------- | :------ | :----------------------- | :--------- | :--------------- | :---------------- | :------------------------------------------------- |
|      | Göteborg    | 1480      | Västergötland | Västra Götalands län | 14      | Västra Götalandsregionen | 583 000    | 1654             | 1123              | [Öppna](https://foreningsregistret.se/goteborg)    |
|      | Helsingborg | 1283      | Skåne         | Skåne län            | 12      | Region Skåne             | 149 000    | 567              | 398               | [Öppna](https://foreningsregistret.se/helsingborg) |

- Kommunnamn - länka till kommunens hemsida
- Föreningsregister (RBOK, FRI, etc) - länka till föreningssidan

Klick ger öppnad högervy









- [x] Sökning inkluderar inte kommuner
- [x] Sökning ger svar på O och A om man söker på Ö Ä och Å

