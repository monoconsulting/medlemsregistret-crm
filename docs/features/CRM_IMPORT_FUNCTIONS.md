# Automatiserat flöde för import av webscrapad

# föreningsdata till CRM-systemet

I detta avsnitt presenteras en **hållbar, enkel och automatiserad** lösning för att ta data insamlad via
webscraping (föreningsinformation i JSON-format) och importera den till CRM-systemets MySQL-
databas. Flödet integreras i den befintliga kodbasen (TypeScript, Prisma, tRPC, Next.js) och utnyttjar
även AI-agenten (GPT-4) för databerikning där det är lämpligt. Lösningen består av flera steg, från
lagring av JSON-filer till datavalidering, databasmappning, import via Prisma samt AI-baserad
komplettering. Allt är tänkt att köras lokalt (ingen extern molnlagring), och hela kedjan kan
automatiseras via ett CLI-kommando eller schemalagt skript.

## Steg 1: Insamling och lagring av JSON-data från webscraping

**Webscraping-skriptet** (befintligt) körs för att hämta föreningsinformation från kommunernas register.
Vi förutsätter att detta skript exporterar resultaten som JSON-data lokalt på filsystemet. Enligt
specifikationen genereras **ett JSON-objekt per förening** med följande struktur :

```
Run-metadata: source_system (t.ex. "FRI"), municipality (kommunnamn),
scrape_run_id (ID för scrapekörning), scraped_at (timestamp för körningen).
association: Kärnfälten för föreningen – name, org_number, types, activities,
categories, homepage_url, detail_url, street_address, postal_code, city,
email, phone, description.
contacts: Lista av kontaktpersoner med nycklar {contact_person_name,
contact_person_role, contact_person_email, contact_person_phone} (om
kontaktpersoner finns).
source_navigation: Information om var i källsystemet posten hittades – list_page_index
(sida i listvy), position_on_page (radposition), pagination_model, filter_state.
extras: Eventuella extra fält utöver kärnfälten, t.ex. founded_year,
national_affiliation, m.m.
```

JSON-filerna sparas exempelvis i en katalog som data/scrapes/. Varje scrapekörning kan ge upphov
till antingen en samlad JSONL-fil (med en förening per rad) eller flera JSON-filer (en per förening eller
per kommun). **Exempel:** Efter att ha scrapats kommun *X* sparas en fil scrape_X_.json
innehållande alla föreningar för den kommunen. Dessa filer bör lagras på ett ställe där de är åtkomliga
för importskriptet (t.ex. volymmonterade i Docker-containern som kör Node/Next-applikationen). När
webscraping-jobbet körs via bakgrundsjobb (BullMQ används redan för scraping ) kan man
automatiskt spara resultatfilen och uppdatera en loggpost (t.ex. ScrapeRun-tabellen med status
*completed* ).

*Åtgärd:* **Efter varje lyckad scraping-körning triggas importflödet.** Detta kan antingen ske manuellt
(kör ett import-CLI) eller automatiskt – t.ex. genom att bakgrundsjobbet lägger till ett nytt jobb i en kö
för import, eller via ett OS-schemaläggningsverktyg (cron) som kör importskriptet vid givna intervall.

#### 

## Steg 2: Validering och mappning av JSON-data

Innan vi importerar till databasen behöver den scrapade JSON-datan **valideras och mappas** till CRM-
systemets datamodell. Kodbasen använder TypeScript, så vi kan definiera antingen *interfaces* eller
använda ett schema-valideringsbibliotek som **Zod** (som redan används för formulärvalidering ) för
att kontrollera datan. Valideringen säkerställer att obligatoriska fält finns och att datatyper är korrekta,
samt att tomma/saknade värden representeras som null (ingen gissning på okänd data, i enlighet
med scrapingspecifikationen ).

**Mapping av fält:** JSON-nycklarna behöver översättas till de kolumnnamn och format som Prisma-
modellerna använder. Här är en översikt av hur de viktigaste fälten mappas från JSON till Prisma’s
Association- och Contact-modeller:

```
source_system -> Association.sourceSystem (sträng)
municipality -> Association.municipality (sträng)
scrape_run_id -> Association.scrapeRunId (sträng)
scraped_at -> Association.scrapedAt (DateTime). (Konverteras till JavaScript Date vid
import)
association.detail_url -> Association.detailUrl (sträng, unik)
association.name -> Association.name (sträng)
association.org_number -> Association.orgNumber (sträng, nullable)
association.types -> Association.types (string[])
association.activities -> Association.activities (string[])
association.categories -> Association.categories (string[])
association.homepage_url -> Association.homepageUrl (sträng, nullable)
association.street_address -> Association.streetAddress (sträng, nullable)
association.postal_code -> Association.postalCode (sträng, nullable)
association.city -> Association.city (sträng, nullable)
association.email -> Association.email (sträng, nullable)
association.phone -> Association.phone (sträng, nullable)
association.description -> Association.description (Json eller text, nullable).
(Om scrapingresultatet har description som objekt med sections/free_text behålls det
som JSON; om det är en ren textsträng lagras den som text i JSON-fältet, annars null om ingen
beskrivning finns).
source_navigation.list_page_index -> Association.listPageIndex (Int, nullable)
source_navigation.position_on_page -> Association.positionOnPage (Int,
nullable)
source_navigation.pagination_model -> Association.paginationModel (sträng,
nullable)
source_navigation.filter_state -> Association.filterState (Json, nullable)
extras -> Association.extras (Json, nullable). (Extrafälten läggs in som ett JSON-objekt;
exempel: {"founded_year": 1985, "national_affiliation": "Svenska
Fotbollförbundet"}.)
contacts -> Relation till Contact-modellen. Varje objekt i JSON-listan contacts mappas till
en Contact-post kopplad via associationId. Fält: contact_person_name ->
Contact.name , contact_person_email -> Contact.email,
contact_person_phone -> Contact.phone (vi antar att numret sparas som telefon;
alternativt kan det mappas till mobile-fältet beroende på om det representerar
mobilnummer), contact_person_role -> Contact.role.

```



*Valideringssteg:* Vi kan implementera en Zod-schema som matchar strukturen enligt ovan, för att
automatiskt kasta fel om JSON-formatet avviker. Till exempel:

```
import { z }from'zod';
constContactSchema = z.object({
contact_person_name: z.string(),
contact_person_email:z.string().nullable().optional(),
contact_person_phone:z.string().nullable().optional(),
contact_person_role: z.string().nullable().optional()
});
constAssociationSchema= z.object({
name: z.string(),
org_number:z.string().nullable().optional(),
types:z.array(z.string()).optional(),
activities:z.array(z.string()).optional(),
categories:z.array(z.string()).optional(),
homepage_url: z.string().nullable().optional(),
street_address: z.string().nullable().optional(),
postal_code: z.string().nullable().optional(),
city: z.string().nullable().optional(),
email:z.string().nullable().optional(),
phone:z.string().nullable().optional(),
description: z.any().nullable().optional() // could be string or object
});
constScrapedEntrySchema = z.object({
source_system: z.string(),
municipality: z.string(),
scrape_run_id: z.string(),
scraped_at:z.union([z.string(), z.date()]), // accept date string or Date
association: AssociationSchema,
contacts: z.array(ContactSchema).optional(),
source_navigation: z.object({
list_page_index: z.number().optional(),
position_on_page: z.number().optional(),
pagination_model: z.string().optional(),
filter_state: z.any().optional()
}).optional(),
extras: z.record(z.any()).optional()
});
```

I praktiken kan vi använda schemat i importkoden för att parsa varje JSON-post och försäkra oss om att
strukturen är korrekt innan datan skickas till databasen:

```
constrawJson= JSON.parse(fileContent);
constparsedEntries = z.array(ScrapedEntrySchema).parse(rawJson); //
validerar en lista av föreningar
```

Ovanstående schema är ett exempel – beroende på hur JSON-filerna är strukturerade (en lista eller en fil
per objekt) justeras anropet. Notera att vi tillåter vissa fält som optional/nullable beroende på att de kan
saknas eller vara tomma. Efter validering omvandlar vi nycklarna från snake_case till camelCase enligt
mappningen ovan. Detta kan göras manuellt (t.ex. med ett helper-funktion toCamelCase) eller
genom att helt enkelt plocka ut värden och bygga ett nytt objekt för Prisma (se steg 3). Målet är att
matcha Prisma-schemat exakt, annars kommer ORM:en att kasta fel.

## Steg 3: Import till MySQL-databasen via Prisma

När datan är validerad och mappad kan vi skapa databasposter genom **Prisma ORM**. Vi bygger en
**importmodul eller CLI-skript** (t.ex. scripts/importAssociations.ts) som:

```
Läser in JSON-filen/filerna med scrapad data (från data/scrapes/ katalogen).
Validerar och transformerar datan (enligt steg 2).
Använder Prisma-klienten för att skriva posterna till databasen.
```

Nedan visas ett förenklat exempel på ett CLI-skript i TypeScript som utför dessa steg. Detta kan köras
med ts-node eller kompileras till JavaScript och köras med Node. Exemplet utgår från att vi har en
enda JSON-fil innehållande en array av associationer (justera filhantering om formatet skiljer sig):

```
#!/usr/bin/env ts-node
import *as fsfrom'fs';
import { prisma} from'@/lib/prisma'; // importera Prisma-klienten
(konfigurerad mot MySQL)
import { ScrapedEntry}from'./types'; // (antag att vi definierat
ScrapedEntry TS-typ enligt schema i steg 2)
asyncfunction importAssociationsFromFile(filePath: string) {
constfileContent = fs.readFileSync(filePath, 'utf-8');
constentries: ScrapedEntry[] = JSON.parse(fileContent);
for(constentryof entries) {
// Bygg Prisma-dataobjekt med korrekt fältmappning
const data: any = {
sourceSystem: entry.source_system,
municipality: entry.municipality,
scrapeRunId:entry.scrape_run_id,
scrapedAt: newDate(entry.scraped_at),
detailUrl: entry.association.detail_url||undefined,
name: entry.association.name,
orgNumber: entry.association.org_number||null,
types: entry.association.types ?? [],
activities: entry.association.activities ?? [],
categories: entry.association.categories ?? [],
homepageUrl:entry.association.homepage_url ||null,
streetAddress: entry.association.street_address|| null,
postalCode: entry.association.postal_code||null,
city: entry.association.city||null,
email: entry.association.email ||null,
phone: entry.association.phone ||null,
description:entry.association.description?? null,
listPageIndex: entry.source_navigation?.list_page_index,
positionOnPage: entry.source_navigation?.position_on_page,
paginationModel: entry.source_navigation?.pagination_model,
filterState:entry.source_navigation?.filter_state,
extras:entry.extras ?? {},
contacts: {
create: entry.contacts?.map(c => ({
name: c.contact_person_name,
email: c.contact_person_email||null,
phone: c.contact_person_phone||null,
role: c.contact_person_role ||null
})) || []
}
};
try {

// Skapa förening + kontakter i databasen

await prisma.association.create({ data});

console.log(`✔ Importerad: ${data.name}`);

} catch (err:any) {

if(err.code=== 'P2002') {

// Uniketskonflikt (t.ex. detailUrl redan finns) – hantera dubbletter

console.warn(`⚠ Förening ${data.name} finns redan (detailUrl=$ {data.detailUrl}), uppdaterar istället.`);

awaitprisma.association.update({

where: { detailUrl: data.detailUrl},

data: {

...data,

contacts: {

// Ta bort gamla kontakter och lägg till de nya från scrapingen

deleteMany: {},

create: data.contacts.create

}

}

});

} else{

console.error(`Fel vid import av ${data.name}:`, err.message);

}

}

}

}

// Exekvera import för alla JSON-filer i katalogen
constfiles = fs.readdirSync('data/scrapes').filter(f =>
f.endsWith('.json'));
for(constfileoffiles) {
importAssociationsFromFile(`data/scrapes/${file}`);
}
```
I koden ovan sker följande: 

- **Läs in filer:** Vi hämtar alla .json-filer i data/scrapes/. (Om scrapern
genererar en enda JSONL-fil, skulle vi istället läsa rad för rad från den filen). 
-  **Loop över poster:** För varje föreningspost i JSON-datan bygger vi ett data-objekt med fält enligt Prisma’s Association-schema. Notera hur vi sätter null för tomma värden och använder nolltilldelning (?? ) för arrayer. 
- **Skapa i databasen:** Vi anropar prisma.association.create({ data }) för att skapa en
  ny förening tillsammans med eventuella kontakter i ett enda steg (Prisma tillåter *nested create* för
  relationer, här genom contacts.create listan). Kontakterna länkas automatiskt via
  relationsdefinitionen (de får associationId satt till den nya föreningens ID).
- **Hantering av dubbletter:** Vi omger skapandet med en try/catch. Om felkoden indikerar en unik nyckel-konflikt (Prisma P2002), betyder det att en förening med samma detailUrl redan finns i databasen. I så fall väljer vi att uppdatera den befintliga posten istället för att duplicera. Exemplet visar en enkel hantering där vi kör prisma.association.update baserat på detailUrl som unik identifierare. Vi
  uppdaterar alla fält (genom att sprida ...data, men viktigt att justera så att contacts uppdateras
  korrekt). Här används deleteMany för att rensa gamla kontakter och sedan create för att lägga in
  de nya – detta antagande passar om vi betraktar scrapad data som sanningskälla och alltid vill synka
  om kontaktlistan. *(Alternativt kan man göra mer sofistikerad jämförelse per kontakt, men att radera och
  lägga in på nytt är enklare och eftersom onDelete: Cascade är satt för Contact kommer gamla
  kontakter tas bort när associationen uppdateras.)* 
- **Loggning:** Skriptet loggar varje importerad förening, och varnar vid dubbletter eller fel. Detta är användbart både vid manuell körning och schemalagd drift (man kan t.ex. pipa utdata till en loggfil).

Efter att skriptet körts ska de nya posterna nu finnas i MySQL-databasen och vara åtkomliga via Prisma
och tRPC API:er i resten av applikationen. Vi har därmed en automatiserad importpipeline från rå JSON
till normaliserade databastabeller.

## Steg 4: AI-baserad databerikning och åtgärdsförslag

När föreningsdatan väl är i CRM:et kan vi utnyttja den inbyggda **AI-agenten (GPT-5)** för att förbättra
datakvaliteten och ge förslag på nästa steg. Enligt den tekniska stacken finns stöd för OpenAI API
(GPT-4) och Langchain för AI-assistans. Vi kan implementera en **enrich-funktion** som körs efter
import (antingen direkt för varje förening, eller som en separat process som itererar över nya poster).
Denna funktion använder AI för att:

**Föreslå databerikning:** AI kan analysera befintliga fält och eventuell beskrivningstext för att
härleda ny information. T.ex. kan den läsa description.free_text om det finns, och
generera en kort sammanfattning eller extrahera nyckelord. 

Om extras.founded_year saknas men det i fritexten nämns "grundad 1945", kan modellen uppmärksamma detta. På så vis kan AI hjälpa till att fylla i vissa saknade fält – dock bör sådana förslag märkas som osäkra om de inte är direkt bekräftade. Ett säkert exempel är att AI kategoriserar föreningen utifrån
verksamhetsbeskrivningen (t.ex. "denna förening verkar inom idrott och ungdomsverksamhet" - vi kan lägga till en kategori "Ungdomsidrott" i categories). Dessa berikningar kan antingen automatiskt skrivas till databasen (t.ex. uppdatera Association.categories eller lägga till en tagg) eller presenteras för en administratör som förslag innan de godkänns. 

**Fylla i saknade kontaktfält:** I vissa fall kan AI försöka härleda kontaktinformation. Exempel: om
homepageUrl finns (foreningen.se) men email saknas, skulle AI kunna gissa att en
möjlig e-postadress är info@foreningen.se. Detta är dock en gissning – istället för att direkt
fylla i, kan systemet flagga föreningen för uppföljning (t.ex. skapa en uppgift att manuell leta
upp e-post) eller låta AI lämna ett förslag som användaren kan bekräfta. På samma sätt kan AI
kontrollera om telefonnummerformat är standard och föreslå formatering om det är felaktigt
(t.ex. lägga till riktnummer).

**Föreslå åtgärder (CRM-status eller pipeline):** Beroende på data kan AI ge rekommendationer
för hur föreningen bör behandlas i säljprocessen. Exempel: om en förening har komplett
kontaktinfo (e-post och telefon) och kanske är del av en intressant kategori, kan AI föreslå att
sätta dem i pipeline-status QUALIFIED och ge en åtgärd " Skicka introduktionsmail ". Om en
förening å andra sidan saknar kontaktuppgifter helt, kan AI rekommendera " Research behövs –
saknar kontaktinfo " och lämna CRM-status som UNCONTACTED. Dessa bedömningar kan baseras
på regler eller tränade exempel. Med GPT-4 kan vi ställa en prompt som: "Analysera följande
föreningsprofil och föreslå nästa steg för att rekrytera den som medlem samt en lämplig pipeline
status." AI kan då svara med t.ex. "Föreningen saknar e-post – föreslå att ringa eller besöka. Pipeline:
PROSPECT (ej kontaktad ännu).".

**Implementationssätt:** AI-berikningen kan implementeras som en del av importskriptet (direkt efter
varje insert) eller som en separat modul (t.ex. en tRPC-procedure under aiRouter eller en BullMQ-
jobb som körs periodiskt på nya poster). För att illustrera hur man kan anropa GPT-4 i koden, se
nedanstående förenklade exempel på en funktion som tar en Association-post och anropar OpenAI API
för att generera förslag:

```
import { Configuration, OpenAIApi} from'openai';
constconfiguration = newConfiguration({ apiKey:
process.env.OPENAI_API_KEY });
constopenai = newOpenAIApi(configuration);
/*** Tar en föreningspost (t.ex. från databasen eller nyss importerat JSON)

* och returnerar AI-genererade förslag på berikning och åtgärder.
  */

asyncfunction enrichAssociationWithAI(assoc: { name:string; description?:
any; email?: string; phone?:string; activities:string[];}) {
// Bygg en prompt som beskriver uppgiften för AI:n
constdescriptionText= typeof assoc.description=== 'string'?
assoc.description: assoc.description?.free_text|| '';
constprompt =
`Förening: ${assoc.name}\n`+
(assoc.activities?.length? `Verksamheter: ${assoc.activities.join(', ')}
\n`: '') +
(descriptionText? `Beskrivning: ${descriptionText}\n`: '') +
(assoc.email ?`E-post: ${assoc.email}\n`: 'E-post: (saknas)\n') +
(assoc.phone ?`Telefon: ${assoc.phone}\n`:'Telefon: (saknas)\n') +
`\n`+
`
```



1. Föreslå kort databerikning (t.ex. kategori eller nyckelord) baserat
  på infon.

2. Om viktiga fält saknas, nämn detta och föreslå nästa steg för att
  skaffa dem.

3. Föreslå en lämplig pipeline-status och nästa åtgärd i CRM. Svara koncist med punktlista.

  ```
  `;
  constresponse =await openai.createChatCompletion({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,
  max_tokens: 300
  });
  constaiResult = response.data.choices[0]?.message?.content;
  returnaiResult;
  }
  // Exempel på användning:
  constnewAssoc = awaitprisma.association.findFirst({ orderBy: { createdAt:
  'desc' } });
  if(newAssoc) {
  constsuggestions = awaitenrichAssociationWithAI(newAssoc);
  console.log("AI-förslag för förening:", newAssoc.name);
  console.log(suggestions);
  }
  ```

  

I denna kod konstruerar vi en prompt på svenska som summerar föreningens kända data och ställer
konkreta frågor i numrerade punkter om berikning, saknade fält och pipeline/åtgärds-förslag. GPT-4-
modellen svarar då (förhoppningsvis) med en lista av förslag. Dessa skulle kunna se ut ungefär så här:

"Kategori: Föreningen är en idrottsklubb (fotboll) för ungdomar."
"Saknar e-postadress – föreslår att försöka hitta kontakt via hemsidan eller ringa."
"Pipeline-status: UNCONTACTED. Åtgärd: Ta första kontakt genom att skicka introduktionsbrev per
post."

Det AI-genererade svaret kan vidare behandlas automatiskt: man kan tänka sig att parsa det om det
följer en strukturerad mall, eller helt enkelt spara hela svaret som en **Note** kopplad till föreningen. CRM-
datamodellen har en Note-entity för att spara anteckningar ; vi kan skapa en ny Note med
authorName: "AI-assistent" och content satt till AI:ets förslag. Då blir förslagen synliga för
användarna i CRM-gränssnittet, utan att direkt ändra några fält. Användaren kan sedan manuellt
besluta att uppdatera t.ex. pipeline-status eller komplettera info med utgångspunkt från AI-förslagen.
Detta angreppssätt ökar förtroendet (AI föreslår, människa verifierar) och håller systemet robust.

**Automatisk fältifyllnad:** I vissa fall kan vi låta AI:n direkt skriva till vissa fält om vi anser förslagen
tillräckligt pålitliga. Exempel: om AI i en beskrivning hittar ett årtal för grundandet och vi inte redan har
extras.founded_year, skulle vi kunna uppdatera Association.extras["founded_year"] med
det värdet. För implementering kan man göra att enrichAssociationWithAI returnerar
strukturerad data (t.ex. JSON med vissa keys) genom att be modellen svara i JSON-format. T.ex. i
prompten: *"Svara endast i JSON-format med nycklarna category, missing_info_action,
pipeline."*. Därefter parse svaret med JSON.parse och använda det för att uppdatera databasen.
Detta kräver dock mycket noggrann prompt-design och att man litar på modellens output-format. Ett enklare alternativ är att köra AI-förslagen som ett separat steg som kräver mänsklig inspektion innan
ändringar går in i databasen.

Sammanfattningsvis ger AI-agenten ett extra lager av intelligens i flödet: den kan hjälpa till att
prioritera vilka föreningar som bör kontaktas först, fylla ut metadata och ge insikter som inte är direkt
uppenbara från rådata. Allt detta sker lokalt genom att ringa OpenAI’s API (internet krävs för API-
anropet, men ingen extern datalagring behövs; svaret kan lagras lokalt i vår databas som anteckningar
eller fält).

## Steg 5: Automation och drift av hela kedjan

För att göra hela processen **så enkel som möjligt att köra automatiserat** binder vi ihop stegen ovan i
ett smidigt arbetsflöde. Några nyckelaspekter för driften:

**CLI-kommando:** Vi definierar ett skript i vårt projekt (såsom importAssociations.ts
demonstrerat ovan) och lägger till ett npm-script alias i package.json, t.ex.
"import-data": "ts-node scripts/importAssociations.ts". Då kan utvecklare eller
driftansvariga enkelt köra npm run import-data (eller via Yarn/Pnpm motsvarande) för att
trigga importen. Om vi även vill inkludera webscraping i samma svep kan vi ha ett skript som
först kör scraping-jobbet och sedan direkt importen. Exempelvis: "scrape-and-import":
"node scripts/runScrape.js && ts-node scripts/importAssociations.ts". Detta
kräver att scrapingen kan triggas från Node-miljön (t.ex. via ett systemanrop eller att
scrapingkod finns som modul). I det befintliga systemet där BullMQ hanterar scrapingjobb kan vi
istället exponera en tRPC-procedure eller CLI som lägger till ett scrape-jobb i kön och väntar på
dess completion, för att sedan köra importlogiken.

**Schemalagd körning:** För att automatisera utan manuell inblandning kan man använda cron-
jobb på servern. T.ex. via crontab: 0 2 * * * cd /app/ && npm run import-data >>
import.log 2>&1 för att köra hela importprocessen varje natt kl 02:00 och logga utdata. Detta
förutsätter att scrapingdata finns tillgänglig vid den tiden (antingen att scrapingen körts strax
innan, eller att skriptet själv startar scrapingen). I systemet kan det också finnas inbyggd
schemaläggning – enligt UI-designen finns stöd för "Schemalagda scrapingar". Ifall scraping-
jobben redan är tidsinställda via BullMQ (t.ex. en job som körs varje vecka), kan vi hooka in
importen efter varje avslutad scraping. Ett sätt är att utnyttja BullMQ’s events: när ett scrape-
jobb markeras som klart (status "completed" i ScrapeRun ), trigga en ny job som kör
import-funktionen. Detta kan konfigureras i bakgrundsprocessen som hanterar kön. Fördelen
med att använda samma jobbkö är att hela kedjan hanteras inom applikationens kontext (vi kan
lätt accessa Prisma-klienten, config etc).

**Hantering av JSON-filer efter import:** Det är bra att rensa eller arkivera JSON-filerna efter
lyckad import, för att inte importera om dem av misstag och för att spara diskutrymme. I
importskriptet ovan skulle man i slutet kunna flytta filen till en underkatalog processed/ eller
döpa om den (t.ex. till .imported extension), alternativt ta bort den helt om backup inte
behövs. Eftersom datan nu ligger i databasen och vi dessutom loggar utfallet, är filerna oftast
inte nödvändiga att behålla. Men för säkerhets skull kan man spara dem ett tag ifall man
behöver felsöka. En annan strategi är att använda JSONL som inte tas bort direkt men hålla reda
på senaste importerade rad via scrapeRunId så att dubletter inte tas in. Enkelt uttryckt: efter
varje run, städa upp. Detta kan integreras i skriptet (t.ex. i slutet av importAssociationsFromFile ta bort filePath). Glöm inte att hantera fel – om importen avbryts mitt i, ta inte bort filen, utan låt den ligga kvar så att man kan försöka igen efter att problemet åtgärdats.
Integritet och transaktioner: Beroende på krav kan man överväga att köra hela importen i en
transaktion eller köra enskilda inserts i sekvens. Prisma stödjer transaktioner (t.ex. prisma.
$transaction([...])), men eftersom vi kanske importerar många poster är det oftast okej
att låta dem ske individuellt – om en post failar (t.ex. oväntat format), loggar vi felet och
fortsätter med nästa istället för att rulla tillbaka allt. Därför är felhantering per post (som i koden
ovan) lämpligt för robusthet.

**Prestanda:** Om det rör sig om väldigt många föreningar (tiotusentals), kan importprocessen
optimeras. Några idéer: använda prisma.association.createMany() för att batcha
insertion av föreningar (utan kontakter) och sedan prisma.contact.createMany() för
kontakterna. Men createMany ignorerar relationslogik och validering, så man måste själv
hantera förenings-ID för kontakterna. I vår kontext, där kanske varje kommun har ett hanterbart
antal föreningar (kanske hundratal eller något tusental), är det oftast tillräckligt att importera
sekventiellt med relationsinbäddning som visat. Prisma/MySQL klarar detta bra för rimliga
datamängder. För riktigt stora datamängder kan man använda en streaming JSON-parser för att
inte läsa in allt i minnet på en gång, men det blir sällan nödvändigt.
**Fit i kodbasen:** Vi placerar importskriptet i projektets struktur på ett logiskt ställe, t.ex. under
scripts/ eller som en del av backend (kanske under server/utils). Det kan återanvända
konfiguration från projektet (t.ex. Prisma-klienten inställd via .env för databasen). Eftersom
Next.js (t.o.m. med tRPC) kör på Node kan samma databasuppkoppling användas. Se till att
Docker Compose-filen inkluderar mount för de JSON-filerna om containern kör importen. Inga
externa tjänster behövs; allting – scraping, filer, databas och AI-anrop – sker lokalt (för AI-delen
krävs internetaccess för API-nyckeln, men ingen molnlagring).


### Sammanfattning av flödet:

**1. Scraping** – Insamling av föreningsdata från webb, spara lokalt som JSON. *(Redan existerande
skript, integreras via jobb eller CLI.)*
**2. Validering & Mappning** – Läs JSON, validera struktur (t.ex. med Zod), mappa fält från
snake_case till Prisma-modellens format.
**3. Databasimport (Prisma)** – Kör ett importskript som skapar eller uppdaterar Association-
poster i MySQL via Prisma. Inkludera kontakter via relationscreate. Logga resultat och hantera
fel/dubbletter (t.ex. med upsert eller update på detailUrl-unikhet).
**4. AI-berikning** – Anropa AI-agent (GPT-4 via OpenAI API) för varje nyimporterad förening
(antingen on-the-fly eller batchvis). Låt AI:n föreslå kategorier, fylla luckor och ange lämpliga
CRM-åtgärder. Spara förslagen (t.ex. som Notes kopplade till föreningen) eller uppdatera vissa
fält efter mänsklig verifiering.
**5. Rensning & schemaläggning** – Ta bort eller arkivera JSON-filerna efter import. Automatisera
kedjan antingen genom en cron scheduler eller integrerat i backend-jobb. Exempel: ett CLI-
kommando som kan köras manuellt eller via cron för att importera senaste scrapade data.
Eventuellt, integrera med befintliga BullMQ-schedule så att scraping + import körs i följd enligt
schema.

Den beskrivna lösningen passar in i den befintliga stacken och kräver ingen extern infrastruktur. Allt kan
köras lokalt med Docker (MySQL i container; Node-applikationen kan antingen köras i container eller på
host med åtkomst till DB). Genom att använda Prisma säkerställs typssäkerhet och enkel integration
med övriga tRPC-API:er i systemet. AI-komponenten utnyttjar redan existerande AI-integration för att ge mervärde utan att störa det huvudsakliga dataflödet. Slutresultatet blir ett **helt automatiserat flöde** där man exempelvis kan köra ett enda kommando (eller vänta på en schemalagd tid) och få: _"Scraping -> JSON -> Databas -> AI-förslag"_ utfört. Detta gör det enkelt att hålla CRM-systemets data uppdaterad
> med minimal handpåläggning, samtidigt som man får smarta insikter direkt vid import.

CRM_IMPLEMENTATION_1.md
file://file-R5bqACgmgSpNp2KPtpM66d

CRM_SCRAPING_INSTRUCTIONS_V.1.1.md
file://file-U7tVtYiCvpX52n6Kg4qRPV

CRM_IMPLEMENTATION_2.md
file://file-41SaBtZtKH4gDFsSVxFKgM

1 3 4 5 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 23
2 6
22
```

This is a offline tool, your data stays locally and is not send to any server!

[Feedback & Bug Reports](https://github.com/jzillmann/pdf-to-markdown/issues)