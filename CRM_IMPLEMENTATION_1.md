Jag ska titta på JSON-filen för att förstå datastrukturen först.# Komplett CRM-Design för Medlemsregistret.se
*Baserad på scrapad föreningsdata från svenska kommuners register*

---

## 🎯 Teknisk Stack (Optimerad för scrapad data)

**Frontend:**
- **Next.js 15** (App Router) med TypeScript
- **Shadcn/ui** + **Tailwind CSS** 
- **TanStack Query** (React Query v5) för datahantering
- **Zustand** för UI-state
- **React Hook Form** + **Zod** för formulärvalidering

**Backend & Database:**
- **Next.js API Routes** med tRPC för typsäkerhet
- **Prisma ORM** mot MySQL
- **Redis** för caching av stora scraped datasets
- **BullMQ** för scraping-jobb i bakgrunden

**Sök & Filter:**
- **Meilisearch** eller **Typesense** (snabb multi-field sök)
- Full-text på: name, activities, description, contacts
- Faceted search på: municipality, types, national_affiliation

**AI & Analytics:**
- **OpenAI API** (GPT-4) för AI-assistans
- **Langchain** för kontextmedveten AI
- **Recharts** + **Tremor** för visualiseringar

---

## 📊 Databasschema (Prisma)

```prisma
model Association {
  id                    String    @id @default(cuid())
  
  // Scraped data
  sourceSystem          String    // "FRI"
  municipality          String    @index
  scrapeRunId           String
  scrapedAt             DateTime
  detailUrl             String?   @unique
  
  // Core fields
  name                  String    @index
  orgNumber             String?   @index
  types                 String[]  // ["Idrottsförening"]
  activities            String[]  @index // ["Golf", "Tennis"]
  categories            String[]
  
  homepageUrl           String?
  streetAddress         String?
  postalCode            String?
  city                  String?
  email                 String?
  phone                 String?
  
  // Structured description
  description           Json?     // {sections: [...], free_text: "..."}
  
  // CRM-specific fields
  crmStatus             CrmStatus @default(UNCONTACTED)
  isMember              Boolean   @default(false)
  memberSince           DateTime?
  pipeline              Pipeline  @default(PROSPECT)
  assignedTo            String?   // User ID
  
  // Relations
  contacts              Contact[]
  notes                 Note[]
  tags                  Tag[]
  groupMemberships      GroupMembership[]
  activities            Activity[]
  
  // Source navigation
  listPageIndex         Int?
  positionOnPage        Int?
  paginationModel       String?
  filterState           Json?
  
  // Extras
  extras                Json?     // {founded_year, fiscal_year_start, etc}
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@index([municipality, types])
  @@index([crmStatus, pipeline])
  @@fulltext([name, city])
}

enum CrmStatus {
  UNCONTACTED
  CONTACTED
  INTERESTED
  NEGOTIATION
  MEMBER
  LOST
  INACTIVE
}

enum Pipeline {
  PROSPECT
  QUALIFIED
  PROPOSAL_SENT
  FOLLOW_UP
  CLOSED_WON
  CLOSED_LOST
}

model Contact {
  id              String      @id @default(cuid())
  associationId   String
  association     Association @relation(fields: [associationId], references: [id], onDelete: Cascade)
  
  name            String
  role            String?
  email           String?     @index
  phone           String?
  mobile          String?
  
  // Social media
  linkedinUrl     String?
  facebookUrl     String?
  twitterUrl      String?
  instagramUrl    String?
  
  isPrimary       Boolean     @default(false)
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([associationId])
}

model Note {
  id              String      @id @default(cuid())
  associationId   String
  association     Association @relation(fields: [associationId], references: [id], onDelete: Cascade)
  
  content         String      @db.Text
  tags            String[]
  authorId        String      // User ID
  authorName      String
  
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  @@index([associationId, createdAt])
}

model Tag {
  id              String      @id @default(cuid())
  name            String      @unique
  color           String      @default("#3b82f6")
  associations    Association[]
  
  createdAt       DateTime    @default(now())
}

model Group {
  id              String            @id @default(cuid())
  name            String
  description     String?
  
  // Search query that defines the group
  searchQuery     Json?             // {municipality: "Stockholm", types: ["Idrottsförening"]}
  autoUpdate      Boolean           @default(false)
  
  memberships     GroupMembership[]
  createdBy       String            // User ID
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

model GroupMembership {
  id              String      @id @default(cuid())
  groupId         String
  group           Group       @relation(fields: [groupId], references: [id], onDelete: Cascade)
  associationId   String
  association     Association @relation(fields: [associationId], references: [id], onDelete: Cascade)
  
  addedAt         DateTime    @default(now())
  
  @@unique([groupId, associationId])
}

model Activity {
  id              String      @id @default(cuid())
  associationId   String?
  association     Association? @relation(fields: [associationId], references: [id], onDelete: Cascade)
  
  type            ActivityType
  description     String
  metadata        Json?
  
  userId          String
  userName        String
  
  createdAt       DateTime    @default(now())
  
  @@index([associationId, createdAt])
  @@index([userId, createdAt])
}

enum ActivityType {
  CREATED
  UPDATED
  STATUS_CHANGED
  NOTE_ADDED
  EMAIL_SENT
  CALL_MADE
  MEETING_SCHEDULED
  TAG_ADDED
  MEMBER_CONVERTED
}

model ScrapeRun {
  id              String      @id @default(cuid())
  municipality    String
  status          String      // "running", "completed", "failed"
  startedAt       DateTime
  completedAt     DateTime?
  
  totalFound      Int?
  totalProcessed  Int?
  errors          Json?
  
  @@index([municipality, startedAt])
}
```

---

## 🎨 Komplett Sidstruktur

### **1. DASHBOARD (Startsida)**

```typescript
// Layout: 12-kolumns grid med responsive breakpoints
<div className="grid grid-cols-12 gap-6 p-6">
  
  {/* KPI-kort (span 12) */}
  <div className="col-span-12 grid grid-cols-4 gap-4">
    <KPICard 
      title="Totalt föreningar"
      value={totalAssociations}
      change="+12%"
      icon={<Building2 />}
      trend="up"
      details={`${scrapedToday} nya idag`}
    />
    <KPICard 
      title="Medlemmar"
      value={members}
      percentage={`${memberPercentage}%`}
      icon={<CheckCircle />}
      trend="up"
    />
    <KPICard 
      title="Pipeline"
      value={prospects}
      icon={<Target />}
      trend="neutral"
    />
    <KPICard 
      title="Konvertering"
      value={`${conversionRate}%`}
      icon={<TrendingUp />}
      trend="up"
    />
  </div>

  {/* Huvudinnehåll (span 8) */}
  <div className="col-span-12 lg:col-span-8 space-y-6">
    
    {/* Aktivitetsflöde */}
    <Card>
      <CardHeader>
        <CardTitle>Aktivitetsflöde</CardTitle>
        <FilterTabs options={['Alla', 'Mina', 'Team']} />
      </CardHeader>
      <CardContent>
        <ActivityTimeline 
          activities={recentActivities}
          realtime={true}
        />
      </CardContent>
    </Card>

    {/* Kommande uppgifter */}
    <Card>
      <CardHeader>
        <CardTitle>Kommande uppgifter</CardTitle>
      </CardHeader>
      <CardContent>
        <TaskList tasks={upcomingTasks} />
      </CardContent>
    </Card>

    {/* Medlemsutveckling */}
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle>Medlemsutveckling senaste 12 månaderna</CardTitle>
      </CardHeader>
      <CardContent>
        <MembershipChart data={membershipData} />
      </CardContent>
    </Card>
  </div>

  {/* Sidebar (span 4) */}
  <div className="col-span-12 lg:col-span-4 space-y-6">
    
    {/* Snabbstatistik */}
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Kommuner</CardTitle>
      </CardHeader>
      <CardContent>
        <MunicipalityList data={topMunicipalities} />
      </CardContent>
    </Card>

    {/* Sparade grupperingar */}
    <Card>
      <CardHeader>
        <CardTitle>Snabbåtkomst</CardTitle>
      </CardHeader>
      <CardContent>
        <SavedGroupsList groups={savedGroups} />
      </CardContent>
    </Card>

    {/* AI-assistent */}
    <Card>
      <CardHeader>
        <CardTitle>AI-Assistent</CardTitle>
      </CardHeader>
      <CardContent>
        <AIQuickActions />
      </CardContent>
    </Card>
  </div>
</div>
```

---

### **2. KOMMUNÖVERSIKT**

```typescript
<div className="flex h-[calc(100vh-4rem)]">
  
  {/* Karta (50%) */}
  <div className="w-1/2 relative">
    <SwedenMap
      municipalities={municipalities}
      onMunicipalityClick={handleMunicipalityClick}
      colorScale={getColorByAssociationCount}
      selectedMunicipality={selectedMunicipality}
    />
    
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">Färgkodning</h3>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>&gt; 100 föreningar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" />
          <span>50-100 föreningar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>&lt; 50 föreningar</span>
        </div>
      </div>
    </div>
  </div>

  {/* Lista (50%) */}
  <div className="w-1/2 bg-gray-50 overflow-auto">
    <div className="sticky top-0 bg-white z-10 p-4 border-b">
      <Input
        placeholder="🔍 Sök kommun..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Select onValueChange={handleSortChange}>
        <SelectTrigger className="mt-2">
          <SelectValue placeholder="Sortera efter..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Alfabetisk</SelectItem>
          <SelectItem value="count">Antal föreningar</SelectItem>
          <SelectItem value="updated">Senast uppdaterad</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="p-4 space-y-2">
      {filteredMunicipalities.map(municipality => (
        <Card 
          key={municipality.name}
          className="hover:bg-blue-50 cursor-pointer transition-colors"
          onClick={() => navigateToAssociations(municipality.name)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  📍 {municipality.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {municipality.associationCount} föreningar
                </p>
                <p className="text-xs text-gray-500">
                  Senast uppdaterad: {formatDate(municipality.lastScraped)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getMemberBadgeVariant(municipality.memberCount)}>
                  {municipality.memberCount} medlemmar
                </Badge>
                <ArrowRight className="text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
</div>
```

---

### **3. FÖRENINGSLISTA (Huvudvy med avancerad filtrering)**

```typescript
<div className="h-full flex flex-col">
  
  {/* Top Bar - Sök & Filter */}
  <div className="bg-white border-b p-4 space-y-4">
    
    {/* Huvudsök */}
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Sök föreningar, aktiviteter, kontakter..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>
      <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
        <Filter className="mr-2 h-4 w-4" />
        Filter ({activeFilterCount})
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Vy
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setView('table')}>
            <Table2 className="mr-2 h-4 w-4" />
            Tabell
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView('grid')}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Kort
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setView('map')}>
            <Map className="mr-2 h-4 w-4" />
            Karta
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    {/* Expanderbar filterpanel */}
    {showFilters && (
      <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        
        {/* Kommun */}
        <div>
          <Label>Kommun</Label>
          <MultiSelect
            options={municipalities}
            value={selectedMunicipalities}
            onChange={setSelectedMunicipalities}
            placeholder="Alla kommuner"
          />
        </div>

        {/* Föreningstyp */}
        <div>
          <Label>Föreningstyp</Label>
          <MultiSelect
            options={associationTypes}
            value={selectedTypes}
            onChange={setSelectedTypes}
            placeholder="Alla typer"
          />
        </div>

        {/* Aktiviteter */}
        <div>
          <Label>Aktiviteter</Label>
          <MultiSelect
            options={activities}
            value={selectedActivities}
            onChange={setSelectedActivities}
            placeholder="Alla aktiviteter"
            searchable
          />
        </div>

        {/* CRM-status */}
        <div>
          <Label>CRM-status</Label>
          <Select value={crmStatus} onValueChange={setCrmStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Alla status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla</SelectItem>
              <SelectItem value="MEMBER">🟢 Medlem</SelectItem>
              <SelectItem value="INTERESTED">🟡 Intresserad</SelectItem>
              <SelectItem value="CONTACTED">🔵 Kontaktad</SelectItem>
              <SelectItem value="UNCONTACTED">⚪ Ej kontaktad</SelectItem>
              <SelectItem value="LOST">🔴 Förlorad</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Taggar */}
        <div>
          <Label>Taggar</Label>
          <TagSelect
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </div>

        {/* Riksorganisation */}
        <div>
          <Label>Riksorganisation</Label>
          <ComboBox
            options={nationalAffiliations}
            value={selectedAffiliation}
            onChange={setSelectedAffiliation}
            placeholder="Välj..."
          />
        </div>

        {/* Kontaktinformation */}
        <div>
          <Label>Har kontaktinfo</Label>
          <div className="flex gap-2 mt-2">
            <Checkbox 
              id="hasEmail" 
              checked={filters.hasEmail}
              onCheckedChange={(checked) => updateFilter('hasEmail', checked)}
            />
            <label htmlFor="hasEmail" className="text-sm">E-post</label>
            
            <Checkbox 
              id="hasPhone"
              checked={filters.hasPhone}
              onCheckedChange={(checked) => updateFilter('hasPhone', checked)}
            />
            <label htmlFor="hasPhone" className="text-sm">Telefon</label>
          </div>
        </div>

        {/* Senast uppdaterad */}
        <div>
          <Label>Senast uppdaterad</Label>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        {/* Aktionsknappar */}
        <div className="col-span-4 flex justify-between items-center pt-2 border-t">
          <Button variant="ghost" onClick={clearFilters}>
            Rensa filter
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveCurrentSearch()}>
              <Save className="mr-2 h-4 w-4" />
              Spara sökning
            </Button>
            <Button onClick={() => createGroupFromSearch()}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Skapa gruppering
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Aktiva filter (chips) */}
    {activeFilters.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {activeFilters.map(filter => (
          <Badge key={filter.key} variant="secondary" className="gap-1">
            {filter.label}: {filter.value}
            <X 
              className="h-3 w-3 cursor-pointer" 
              onClick={() => removeFilter(filter.key)}
            />
          </Badge>
        ))}
      </div>
    )}

    {/* Bulk actions bar (visas vid selektion) */}
    {selectedAssociations.length > 0 && (
      <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
        <span className="text-sm font-medium">
          {selectedAssociations.length} förening(ar) markerade
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Tag className="mr-2 h-4 w-4" />
            Lägg till taggar
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Skicka mail
          </Button>
          <Button size="sm" variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Tilldela säljare
          </Button>
          <Button size="sm" variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Lägg i gruppering
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Ändra status</DropdownMenuItem>
              <DropdownMenuItem>Exportera</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Ta bort markering
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )}

    {/* Action buttons */}
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <Button onClick={() => openCreateModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Ny förening
        </Button>
        <Button variant="outline" onClick={() => triggerScrapeJob()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Uppdatera data
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => exportData()}>
          <Download className="mr-2 h-4 w-4" />
          Exportera
        </Button>
      </div>
    </div>
  </div>

  {/* Results count och sortering */}
  <div className="bg-gray-50 px-4 py-2 flex justify-between items-center text-sm">
    <span className="text-gray-600">
      Visar {displayedCount} av {totalCount} föreningar
    </span>
    <div className="flex items-center gap-2">
      <Label className="text-gray-600">Sortera:</Label>
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Namn (A-Ö)</SelectItem>
          <SelectItem value="name-desc">Namn (Ö-A)</SelectItem>
          <SelectItem value="updated-desc">Senast uppdaterad</SelectItem>
          <SelectItem value="created-desc">Senast skapad</SelectItem>
          <SelectItem value="municipality-asc">Kommun (A-Ö)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Content area - växlar mellan table/grid/map */}
  <div className="flex-1 overflow-auto">
    {view === 'table' && <AssociationTableView />}
    {view === 'grid' && <AssociationGridView />}
    {view === 'map' && <AssociationMapView />}
  </div>
</div>
```

---

### **4. FÖRENINGSVY (Detaljsida) - Baserad på scrapad data**

```typescript
<div className="h-full flex flex-col">
  
  {/* Header */}
  <div className="bg-white border-b p-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Tillbaka
          </Button>
          <Badge variant={getSourceBadgeVariant(association.sourceSystem)}>
            {association.sourceSystem}
          </Badge>
          <Badge>{association.municipality}</Badge>
        </div>

        <h1 className="text-3xl font-bold mb-2">{association.name}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {association.orgNumber && (
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {association.orgNumber}
            </span>
          )}
          {association.city && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {association.city}
            </span>
          )}
          {association.homepageUrl && (
            <a 
              href={association.homepageUrl} 
              target="_blank"
              className="flex items-center gap-1 hover:text-blue-600"
            >
              <ExternalLink className="h-4 w-4" />
              Besök webbplats
            </a>
          )}
        </div>

        {/* Status badge */}
        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={association.crmStatus} />
          {association.isMember && (
            <Badge variant="success">
              <CheckCircle className="h-3 w-3 mr-1" />
              Medlem sedan {formatDate(association.memberSince)}
            </Badge>
          )}
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {association.tags.map(tag => (
            <Badge key={tag.id} style={{backgroundColor: tag.color}}>
              {tag.name}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={() => openTagModal()}>
            <Plus className="h-3 w-3 mr-1" />
            Lägg till tagg
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setEditMode(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Redigera
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEmailModal()}>
              <Mail className="mr-2 h-4 w-4" />
              Skicka mail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCallModal()}>
              <Phone className="mr-2 h-4 w-4" />
              Logga samtal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openMeetingModal()}>
              <Calendar className="mr-2 h-4 w-4" />
              Boka möte
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => viewInSource()}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Visa i källsystem
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => refreshFromSource()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Uppdatera från källa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Ta bort
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>

  {/* Tabs & Content */}
  <div className="flex-1 flex overflow-hidden">
    
    {/* Main content area */}
    <div className="flex-1 overflow-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="sticky top-0 bg-white border-b w-full justify-start px-6">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="contacts">
            Kontakter
            {association.contacts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {association.contacts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Anteckningar
            {association.notes.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {association.notes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
          <TabsTrigger value="scraped-data">Scrapad data</TabsTrigger>
        </TabsList>

        {/* TAB 1: Översikt */}
        <TabsContent value="overview" className="p-6 space-y-6">
          
          {/* Typ & Aktiviteter */}
          <Card>
            <CardHeader>
              <CardTitle>Föreningstyp & Aktiviteter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Typ</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {association.types.map(type => (
                    <Badge key={type} variant="outline">{type}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">Aktiviteter</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {association.activities.map(activity => (
                    <Badge key={activity} variant="secondary">{activity}</Badge>
                  ))}
                </div>
              </div>

              {association.extras?.national_affiliation && (
                <div>
                  <Label className="text-sm text-gray-600">Riksorganisation</Label>
                  <p className="mt-1">{association.extras.national_affiliation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Beskrivning från scrapad data */}
          {association.description && (
            <Card>
              <CardHeader>
                <CardTitle>Beskrivning</CardTitle>
              </CardHeader>
              <CardContent>
                {association.description.free_text && (
                  <p className="text-gray-700 mb-4">
                    {association.description.free_text}
                  </p>
                )}

                {association.description.sections?.map((section, idx) => (
                  <div key={idx} className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">
                      {section.title}
                    </h4>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {Object.entries(section.data).map(([key, value]) => (
                        value && (
                          <React.Fragment key={key}>
                            <dt className="text-gray-600 capitalize">
                              {formatLabel(key)}:
                            </dt>
                            <dd className="text-gray-900">
                              {formatValue(value)}
                            </dd>
                          </React.Fragment>
                        )
                      ))}
                    </dl>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Kontaktinformation */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinformation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {association.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${association.email}`} className="text-blue-600 hover:underline">
                    {association.email}
                  </a>
                </div>
              )}
              {association.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <a href={`tel:${association.phone}`} className="text-blue-600 hover:underline">
                    {association.phone}
                  </a>
                </div>
              )}
              {association.streetAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p>{association.streetAddress}</p>
                    <p>{association.postalCode} {association.city}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI-genererade insikter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI-Insikter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIInsights association={association} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Kontakter */}
        <TabsContent value="contacts" className="p-6">
          <div className="mb-4">
            <Button onClick={() => openAddContactModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Lägg till kontakt
            </Button>
          </div>

          <div className="space-y-4">
            {association.contacts.map(contact => (
              <Card key={contact.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {contact.name}
                            {contact.isPrimary && (
                              <Badge variant="secondary">Primär</Badge>
                            )}
                          </h3>
                          {contact.role && (
                            <p className="text-sm text-gray-600">{contact.role}</p>
                          )}
                        </div>

                        <div className="space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                          {contact.mobile && (
                            <div className="flex items-center gap-2 text-sm">
                              <Smartphone className="h-4 w-4 text-gray-400" />
                              <a href={`tel:${contact.mobile}`} className="text-blue-600 hover:underline">
                                {contact.mobile}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Social media länkar */}
                        <div className="flex gap-2 pt-2">
                          {contact.linkedinUrl && (
                            <a href={contact.linkedinUrl} target="_blank" className="text-gray-600 hover:text-blue-600">
                              <Linkedin className="h-5 w-5" />
                            </a>
                          )}
                          {contact.facebookUrl && (
                            <a href={contact.facebookUrl} target="_blank" className="text-gray-600 hover:text-blue-600">
                              <Facebook className="h-5 w-5" />
                            </a>
                          )}
                          {contact.twitterUrl && (
                            <a href={contact.twitterUrl} target="_blank" className="text-gray-600 hover:text-blue-600">
                              <Twitter className="h-5 w-5" />
                            </a>
                          )}
                          {contact.instagramUrl && (
                            <a href={contact.instagramUrl} target="_blank" className="text-gray-600 hover:text-blue-600">
                              <Instagram className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => editContact(contact)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Redigera
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPrimaryContact(contact)}>
                          <Star className="mr-2 h-4 w-4" />
                          Sätt som primär
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => sendEmail(contact)}>
                          <Mail className="mr-2 h-4 w-4" />
                          Skicka mail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => callContact(contact)}>
                          <Phone className="mr-2 h-4 w-4" />
                          Ring
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => deleteContact(contact)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Ta bort
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: Anteckningar (Gästboksformat) */}
        <TabsContent value="notes" className="p-6">
          
          {/* Nytt antecknings-formulär */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitNote}>
                <Textarea
                  placeholder="Skriv en anteckning..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={3}
                  className="mb-3"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <TagInput
                      value={newNoteTags}
                      onChange={setNewNoteTags}
                      placeholder="Lägg till taggar..."
                    />
                  </div>
                  <Button type="submit" disabled={!newNoteContent.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Lägg till
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Anteckningslista */}
          <div className="space-y-4">
            {association.notes.map(note => (
              <Card key={note.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(note.authorName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold">{note.authorName}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatDateTime(note.createdAt)}
                          </span>
                        </div>
                        
                        {note.authorId === currentUser.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => editNote(note)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Redigera
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteNote(note)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Radera
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <p className="text-gray-700 whitespace-pre-wrap mb-2">
                        {note.content}
                      </p>

                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {association.notes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Inga anteckningar ännu</p>
                <p className="text-sm">Lägg till den första anteckningen ovan</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 4: Aktivitet (Automatisk logg) */}
        <TabsContent value="activity" className="p-6">
          <ActivityTimeline activities={association.activities} />
        </TabsContent>

        {/* TAB 5: Scrapad data (Raw view för avancerade användare) */}
        <TabsContent value="scraped-data" className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Källdata från {association.sourceSystem}</CardTitle>
              <CardDescription>
                Hämtad från {association.municipality} kommun
                <br />
                Scrape run ID: {association.scrapeRunId}
                <br />
                Scrapad: {formatDateTime(association.scrapedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Käll-URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-gray-100 p-2 rounded flex-1 overflow-x-auto">
                      {association.detailUrl}
                    </code>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(association.detailUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Navigation metadata</Label>
                  <pre className="text-xs bg-gray-100 p-4 rounded mt-2 overflow-x-auto">
                    {JSON.stringify({
                      listPageIndex: association.listPageIndex,
                      positionOnPage: association.positionOnPage,
                      paginationModel: association.paginationModel,
                      filterState: association.filterState
                    }, null, 2)}
                  </pre>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Extras</Label>
                  <pre className="text-xs bg-gray-100 p-4 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(association.extras, null, 2)}
                  </pre>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Fullständig description-struktur</Label>
                  <pre className="text-xs bg-gray-100 p-4 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(association.description, null, 2)}
                  </pre>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => refreshFromSource()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Uppdatera från källa
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => copyRawData()}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Kopiera rådata (JSON)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    {/* Sidebar (30%) */}
    <div className="w-96 border-l bg-gray-50 overflow-auto p-6 space-y-6">
      
      {/* Pipeline & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm">Status</Label>
            <Select 
              value={association.crmStatus} 
              onValueChange={updateCrmStatus}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNCONTACTED">⚪ Ej kontaktad</SelectItem>
                <SelectItem value="CONTACTED">🔵 Kontaktad</SelectItem>
                <SelectItem value="INTERESTED">🟡 Intresserad</SelectItem>
                <SelectItem value="NEGOTIATION">🟠 Förhandling</SelectItem>
                <SelectItem value="MEMBER">🟢 Medlem</SelectItem>
                <SelectItem value="LOST">🔴 Förlorad</SelectItem>
                <SelectItem value="INACTIVE">⚫ Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Pipeline-steg</Label>
            <Select 
              value={association.pipeline} 
              onValueChange={updatePipeline}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROSPECT">Prospekt</SelectItem>
                <SelectItem value="QUALIFIED">Kvalificerad</SelectItem>
                <SelectItem value="PROPOSAL_SENT">Offert skickad</SelectItem>
                <SelectItem value="FOLLOW_UP">Uppföljning</SelectItem>
                <SelectItem value="CLOSED_WON">Vunnen</SelectItem>
                <SelectItem value="CLOSED_LOST">Förlorad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Ansvarig säljare</Label>
            <Select 
              value={association.assignedTo} 
              onValueChange={updateAssignedTo}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Välj säljare..." />
              </SelectTrigger>
              <SelectContent>
                {salesPeople.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {association.isMember && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-green-900">
                Medlem sedan {formatDate(association.memberSince)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snabbåtgärder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" onClick={() => openEmailModal()}>
            <Mail className="mr-2 h-4 w-4" />
            Skicka mail
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => openCallModal()}>
            <Phone className="mr-2 h-4 w-4" />
            Logga samtal
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => openMeetingModal()}>
            <Calendar className="mr-2 h-4 w-4" />
            Boka möte
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => addTask()}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Skapa uppgift
          </Button>
        </CardContent>
      </Card>

      {/* Medlemsstatistik från MySQL */}
      {association.isMember && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medlemsdata</CardTitle>
          </CardHeader>
          <CardContent>
            <MemberStatistics associationId={association.id} />
          </CardContent>
        </Card>
      )}

      {/* Grupperingar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grupperingar</CardTitle>
        </CardHeader>
        <CardContent>
          {association.groupMemberships.length > 0 ? (
            <div className="space-y-2">
              {association.groupMemberships.map(membership => (
                <Badge key={membership.id} variant="outline">
                  {membership.group.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Ingen gruppering än
            </p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
            onClick={() => addToGroup()}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Lägg till i gruppering
          </Button>
        </CardContent>
      </Card>

      {/* AI-förslag */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI-Förslag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AISuggestions association={association} />
        </CardContent>
      </Card>
    </div>
  </div>
</div>
```

---

## 🎨 Designsystem & UI-Komponenter

```typescript
// Färgpalette
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a'
  },
  warning: {
    50: '#fefce8',
    500: '#eab308',
    600: '#ca8a04'
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  }
}

// Status-färger
const statusColors = {
  UNCONTACTED: 'gray',
  CONTACTED: 'blue',
  INTERESTED: 'yellow',
  NEGOTIATION: 'orange',
  MEMBER: 'green',
  LOST: 'red',
  INACTIVE: 'gray'
}
```

---