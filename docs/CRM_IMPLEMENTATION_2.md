# Komplett CRM-Design - Del 2: Avancerade Funktioner & Implementation

## 🎯 MODALER & DIALOGER

### **1. Redigera Förening (Modal)**

```typescript
<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
    <DialogHeader>
      <DialogTitle>Redigera {association.name}</DialogTitle>
      <DialogDescription>
        Uppdatera föreningens information
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit(onSubmit)}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Grundinfo</TabsTrigger>
          <TabsTrigger value="contact">Kontakt</TabsTrigger>
          <TabsTrigger value="activities">Aktiviteter</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
        </TabsList>

        {/* Tab 1: Grundinfo */}
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Föreningsnamn *</Label>
              <Input
                id="name"
                {...register('name', { required: true })}
                placeholder="Ex: Solna IF"
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">Namnet krävs</p>
              )}
            </div>

            <div>
              <Label htmlFor="orgNumber">Organisationsnummer</Label>
              <Input
                id="orgNumber"
                {...register('orgNumber')}
                placeholder="XXXXXX-XXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="municipality">Kommun *</Label>
              <Select
                value={watch('municipality')}
                onValueChange={(value) => setValue('municipality', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kommun..." />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map(muni => (
                    <SelectItem key={muni} value={muni}>
                      {muni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="types">Föreningstyp *</Label>
              <MultiSelect
                value={watch('types')}
                onChange={(value) => setValue('types', value)}
                options={associationTypes}
                placeholder="Välj typ(er)..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="homepageUrl">Hemsida</Label>
            <Input
              id="homepageUrl"
              {...register('homepageUrl')}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div>
            <Label>Beskrivning</Label>
            <Textarea
              {...register('description.free_text')}
              rows={5}
              placeholder="Beskriv föreningen..."
            />
          </div>

          <div>
            <Label htmlFor="foundedYear">Grundad (år)</Label>
            <Input
              id="foundedYear"
              {...register('extras.founded_year')}
              type="number"
              placeholder="YYYY"
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <Label htmlFor="nationalAffiliation">Riksorganisation</Label>
            <ComboBox
              value={watch('extras.national_affiliation')}
              onChange={(value) => setValue('extras.national_affiliation', value)}
              options={nationalAffiliations}
              placeholder="Välj eller skriv..."
              creatable
            />
          </div>
        </TabsContent>

        {/* Tab 2: Kontaktinfo */}
        <TabsContent value="contact" className="space-y-4">
          <div>
            <Label htmlFor="email">E-postadress</Label>
            <Input
              id="email"
              {...register('email')}
              type="email"
              placeholder="info@foreningen.se"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              {...register('phone')}
              type="tel"
              placeholder="08-123 45 67"
            />
          </div>

          <Separator />

          <div>
            <Label htmlFor="streetAddress">Gatuadress</Label>
            <Input
              id="streetAddress"
              {...register('streetAddress')}
              placeholder="Exempelgatan 1"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label htmlFor="postalCode">Postnummer</Label>
              <Input
                id="postalCode"
                {...register('postalCode')}
                placeholder="123 45"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="city">Ort</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Stockholm"
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Aktiviteter & Kategorier */}
        <TabsContent value="activities" className="space-y-4">
          <div>
            <Label>Aktiviteter *</Label>
            <CreatableMultiSelect
              value={watch('activities')}
              onChange={(value) => setValue('activities', value)}
              options={availableActivities}
              placeholder="Välj eller lägg till aktiviteter..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Tryck Enter för att lägga till en ny aktivitet
            </p>
          </div>

          <div>
            <Label>Kategorier</Label>
            <CreatableMultiSelect
              value={watch('categories')}
              onChange={(value) => setValue('categories', value)}
              options={availableCategories}
              placeholder="Lägg till kategorier..."
            />
          </div>

          <Separator />

          <div>
            <Label>Taggar</Label>
            <TagManager
              selectedTags={watch('tags')}
              onChange={(tags) => setValue('tags', tags)}
              existingTags={allTags}
            />
          </div>
        </TabsContent>

        {/* Tab 4: CRM-inställningar */}
        <TabsContent value="crm" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="crmStatus">CRM-Status</Label>
              <Select
                value={watch('crmStatus')}
                onValueChange={(value) => setValue('crmStatus', value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="pipeline">Pipeline-steg</Label>
              <Select
                value={watch('pipeline')}
                onValueChange={(value) => setValue('pipeline', value)}
              >
                <SelectTrigger>
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
          </div>

          <div>
            <Label htmlFor="assignedTo">Ansvarig säljare</Label>
            <Select
              value={watch('assignedTo')}
              onValueChange={(value) => setValue('assignedTo', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj säljare..." />
              </SelectTrigger>
              <SelectContent>
                {salesPeople.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={person.avatar} />
                        <AvatarFallback>{person.initials}</AvatarFallback>
                      </Avatar>
                      {person.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isMember"
              checked={watch('isMember')}
              onCheckedChange={(checked) => setValue('isMember', checked)}
            />
            <Label htmlFor="isMember" className="cursor-pointer">
              Markera som medlem
            </Label>
          </div>

          {watch('isMember') && (
            <div>
              <Label htmlFor="memberSince">Medlem sedan</Label>
              <DatePicker
                value={watch('memberSince')}
                onChange={(date) => setValue('memberSince', date)}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setEditModalOpen(false)}
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Spara ändringar
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

### **2. Lägg till Kontakt (Modal)**

```typescript
<Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Lägg till kontaktperson</DialogTitle>
      <DialogDescription>
        Lägg till en ny kontaktperson för {association.name}
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleContactSubmit(onContactSubmit)}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactName">Namn *</Label>
            <Input
              id="contactName"
              {...registerContact('name', { required: true })}
              placeholder="Anna Andersson"
            />
          </div>

          <div>
            <Label htmlFor="contactRole">Roll</Label>
            <Select
              value={watchContact('role')}
              onValueChange={(value) => setContactValue('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj roll..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ordförande">Ordförande</SelectItem>
                <SelectItem value="Vice ordförande">Vice ordförande</SelectItem>
                <SelectItem value="Kassör">Kassör</SelectItem>
                <SelectItem value="Sekreterare">Sekreterare</SelectItem>
                <SelectItem value="Ledamot">Ledamot</SelectItem>
                <SelectItem value="Tränare">Tränare</SelectItem>
                <SelectItem value="Administratör">Administratör</SelectItem>
                <SelectItem value="Annan">Annan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contactEmail">E-post</Label>
            <Input
              id="contactEmail"
              {...registerContact('email')}
              type="email"
              placeholder="anna@foreningen.se"
            />
          </div>

          <div>
            <Label htmlFor="contactPhone">Telefon</Label>
            <Input
              id="contactPhone"
              {...registerContact('phone')}
              type="tel"
              placeholder="070-123 45 67"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="contactMobile">Mobil</Label>
          <Input
            id="contactMobile"
            {...registerContact('mobile')}
            type="tel"
            placeholder="070-123 45 67"
          />
        </div>

        <Separator />

        <div>
          <Label className="mb-2 block">Sociala medier</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-blue-600" />
              <Input
                {...registerContact('linkedinUrl')}
                placeholder="https://linkedin.com/in/..."
                type="url"
              />
            </div>

            <div className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              <Input
                {...registerContact('facebookUrl')}
                placeholder="https://facebook.com/..."
                type="url"
              />
            </div>

            <div className="flex items-center gap-2">
              <Twitter className="h-5 w-5 text-blue-400" />
              <Input
                {...registerContact('twitterUrl')}
                placeholder="https://twitter.com/..."
                type="url"
              />
            </div>

            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600" />
              <Input
                {...registerContact('instagramUrl')}
                placeholder="https://instagram.com/..."
                type="url"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPrimary"
            checked={watchContact('isPrimary')}
            onCheckedChange={(checked) => setContactValue('isPrimary', checked)}
          />
          <Label htmlFor="isPrimary" className="cursor-pointer">
            Sätt som primär kontakt
          </Label>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setAddContactOpen(false)}
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={isContactSubmitting}>
          {isContactSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Lägg till kontakt
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

### **3. Skicka Mail (Modal med AI-draft)**

```typescript
<Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
    <DialogHeader>
      <DialogTitle>Skicka mail till {association.name}</DialogTitle>
      <DialogDescription>
        {recipients.length > 0 ? (
          <span>Till: {recipients.map(r => r.email).join(', ')}</span>
        ) : (
          <span className="text-red-500">Ingen e-postadress tillgänglig</span>
        )}
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleEmailSubmit(onEmailSubmit)}>
      <div className="space-y-4">
        {/* AI Draft Assistant */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-2">
                  AI Mail-assistent
                </h4>
                <Textarea
                  placeholder="Beskriv vad mailet ska handla om, så genererar AI ett förslag..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  className="bg-white mb-2"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={generateEmailDraft}
                  disabled={isGenerating || !aiPrompt}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Genererar...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generera utkast
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <Label htmlFor="subject">Ämne *</Label>
          <Input
            id="subject"
            {...registerEmail('subject', { required: true })}
            placeholder="Ex: Presentation av Medlemsregistret"
          />
        </div>

        <div>
          <Label htmlFor="body">Meddelande *</Label>
          <RichTextEditor
            value={watchEmail('body')}
            onChange={(value) => setEmailValue('body', value)}
            placeholder="Skriv ditt meddelande här..."
            minHeight={300}
          />
        </div>

        {/* Template shortcuts */}
        <div>
          <Label className="mb-2 block">Snabbmallar</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('introduction')}
            >
              Introduktion
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('followup')}
            >
              Uppföljning
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('offer')}
            >
              Offert
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('reminder')}
            >
              Påminnelse
            </Button>
          </div>
        </div>

        <div>
          <Label>Bilagor</Label>
          <FileUpload
            value={watchEmail('attachments')}
            onChange={(files) => setEmailValue('attachments', files)}
            maxFiles={5}
            maxSize={10 * 1024 * 1024} // 10MB
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="logActivity"
            checked={watchEmail('logActivity')}
            onCheckedChange={(checked) => setEmailValue('logActivity', checked)}
          />
          <Label htmlFor="logActivity" className="cursor-pointer">
            Logga som aktivitet i CRM
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="scheduleForLater"
            checked={scheduleForLater}
            onCheckedChange={setScheduleForLater}
          />
          <Label htmlFor="scheduleForLater" className="cursor-pointer">
            Schemalägg för senare
          </Label>
        </div>

        {scheduleForLater && (
          <div className="grid grid-cols-2 gap-4 pl-6">
            <div>
              <Label htmlFor="scheduleDate">Datum</Label>
              <DatePicker
                value={watchEmail('scheduleDate')}
                onChange={(date) => setEmailValue('scheduleDate', date)}
              />
            </div>
            <div>
              <Label htmlFor="scheduleTime">Tid</Label>
              <TimePicker
                value={watchEmail('scheduleTime')}
                onChange={(time) => setEmailValue('scheduleTime', time)}
              />
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setEmailModalOpen(false)}
        >
          Avbryt
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={saveDraft}
        >
          <Save className="mr-2 h-4 w-4" />
          Spara utkast
        </Button>
        <Button type="submit" disabled={isEmailSubmitting}>
          {isEmailSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {scheduleForLater ? 'Schemalägg' : 'Skicka'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## 📊 GRUPPERINGAR & AVANCERAD SÖK

### **4. Skapa Gruppering från Sökning**

```typescript
<Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Skapa ny gruppering</DialogTitle>
      <DialogDescription>
        Baserad på din aktuella sökning ({filteredCount} föreningar)
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleGroupSubmit(onGroupSubmit)}>
      <div className="space-y-6">
        <div>
          <Label htmlFor="groupName">Gruppnamn *</Label>
          <Input
            id="groupName"
            {...registerGroup('name', { required: true })}
            placeholder="Ex: Stockholm fotbollsklubbar"
          />
        </div>

        <div>
          <Label htmlFor="groupDescription">Beskrivning</Label>
          <Textarea
            id="groupDescription"
            {...registerGroup('description')}
            placeholder="Beskriv vad denna gruppering innehåller..."
            rows={3}
          />
        </div>

        <Separator />

        <div>
          <Label className="mb-3 block">Aktiva filter i sökningen</Label>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {currentFilters.municipality.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Kommun</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentFilters.municipality.map(m => (
                      <Badge key={m} variant="secondary">{m}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentFilters.types.length > 0 && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Föreningstyp</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentFilters.types.map(t => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentFilters.activities.length > 0 && (
              <div className="flex items-start gap-2">
                <Activity className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Aktiviteter</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentFilters.activities.map(a => (
                      <Badge key={a} variant="secondary">{a}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentFilters.crmStatus && (
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">CRM-Status</p>
                  <Badge variant="secondary">{currentFilters.crmStatus}</Badge>
                </div>
              </div>
            )}

            {currentFilters.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Taggar</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentFilters.tags.map(tag => (
                      <Badge key={tag.id} style={{backgroundColor: tag.color}}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {Object.keys(currentFilters).every(key => 
              Array.isArray(currentFilters[key]) ? 
              currentFilters[key].length === 0 : 
              !currentFilters[key]
            ) && (
              <p className="text-sm text-gray-500 italic">
                Inga filter aktiva - alla föreningar kommer inkluderas
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="autoUpdate"
              checked={watchGroup('autoUpdate')}
              onCheckedChange={(checked) => 
                setGroupValue('autoUpdate', checked)
              }
            />
            <Label htmlFor="autoUpdate" className="cursor-pointer">
              Automatisk uppdatering
            </Label>
          </div>

          {watchGroup('autoUpdate') && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Smart gruppering</AlertTitle>
              <AlertDescription>
                Denna gruppering uppdateras automatiskt när nya föreningar 
                matchar dina filter. Perfekt för att alltid ha en aktuell 
                lista över t.ex. alla nya idrottsföreningar i Stockholm.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold">Förhandsvisning</h4>
          </div>
          <p className="text-sm text-gray-700">
            <strong>{filteredCount}</strong> föreningar kommer att inkluderas i 
            denna gruppering baserat på dina filter.
          </p>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCreateGroupOpen(false)}
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={isGroupSubmitting}>
          {isGroupSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Skapa gruppering
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## 📈 STATISTIK & DASHBOARD (MySQL Integration)

### **5. Statistik-sida med MySQL-data**

```typescript
<div className="p-6 space-y-6">
  
  {/* Filter för statistik */}
  <Card>
    <CardHeader>
      <CardTitle>Statistikfilter</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <Label>Tidsperiod</Label>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Senaste 7 dagarna</SelectItem>
              <SelectItem value="30d">Senaste 30 dagarna</SelectItem>
              <SelectItem value="90d">Senaste 90 dagarna</SelectItem>
              <SelectItem value="12m">Senaste 12 månaderna</SelectItem>
              <SelectItem value="custom">Anpassat intervall</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Kommun</Label>
          <MultiSelect
            value={selectedMunicipalities}
            onChange={setSelectedMunicipalities}
            options={municipalities}
            placeholder="Alla kommuner"
          />
        </div>

        <div>
          <Label>Gruppera efter</Label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dag</SelectItem>
              <SelectItem value="week">Vecka</SelectItem>
              <SelectItem value="month">Månad</SelectItem>
              <SelectItem value="quarter">Kvartal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={refreshStats} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Uppdatera
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* KPI-rader */}
  <div className="grid grid-cols-4 gap-4">
    <StatCard
      title="Totalt medlemmar (från MySQL)"
      value={mysqlStats.totalMembers.toLocaleString()}
      change={mysqlStats.memberGrowth}
      icon={<Users className="h-8 w-8" />}
      trend={mysqlStats.memberGrowth > 0 ? 'up' : 'down'}
      description={`${mysqlStats.activeMemberships} aktiva medlemskap`}
    />

    <StatCard
      title="Nya medlemmar (period)"
      value={mysqlStats.newMembers.toLocaleString()}
      change={mysqlStats.newMemberGrowth}
      icon={<UserPlus className="h-8 w-8" />}
      trend={mysqlStats.newMemberGrowth > 0 ? 'up' : 'down'}
      description="Jämfört med föregående period"
    />

    <StatCard
      title="Konverteringsgrad"
      value={`${mysqlStats.conversionRate}%`}
      change={mysqlStats.conversionRateChange}
      icon={<TrendingUp className="h-8 w-8" />}
      trend={mysqlStats.conversionRateChange > 0 ? 'up' : 'down'}
      description="Prospekt → Medlem"
    />

    <StatCard
      title="Genomsnittlig avtalsintäkt"
      value={`${mysqlStats.avgRevenue.toLocaleString()} kr`}
      change={mysqlStats.avgRevenueChange}
      icon={<DollarSign className="h-8 w-8" />}
      trend={mysqlStats.avgRevenueChange > 0 ? 'up' : 'down'}
      description="Per förening/månad"
    />
  </div>

  {/* Grafer */}
  <div className="grid grid-cols-2 gap-6">
    
    {/* Medlemsutveckling över tid */}
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Medlemsutveckling</CardTitle>
        <CardDescription>
          Antal nya medlemmar per {groupBy === 'day' ? 'dag' : 
                                   groupBy === 'week' ? 'vecka' : 
                                   groupBy === 'month' ? 'månad' : 'kvartal'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={membershipGrowthData}>
            <defs>
              <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="cumulative" 
              name="Totalt" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorMembers)" 
            />
            <Area 
              type="monotone" 
              dataKey="new" 
              name="Nya" 
              stroke="#10b981" 
              fill="#10b981" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Pipeline-översikt */}
    <Card>
      <CardHeader>
        <CardTitle>Pipeline-status</CardTitle>
        <CardDescription>Föreningar per pipeline-steg</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Antal" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Fördelning per kommun */}
    <Card>
      <CardHeader>
        <CardTitle>Medlemmar per kommun (Top 10)</CardTitle>
        <CardDescription>Mest framgångsrika områden</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={membersByMunicipalityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="municipality" width={100} />
            <Tooltip />
            <Bar dataKey="members" fill="#10b981" name="Medlemmar" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Aktivitetstyper distribution */}
    <Card>
      <CardHeader>
        <CardTitle>Populäraste aktiviteter</CardTitle>
        <CardDescription>Bland medlemsföreningar</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={activitiesDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {activitiesDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Revenue trends */}
    <Card>
      <CardHeader>
        <CardTitle>Intäktsutveckling (MRR)</CardTitle>
        <CardDescription>Monthly Recurring Revenue från medlemsskap</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mrr" 
              stroke="#10b981" 
              strokeWidth={2}
              name="MRR (kr)"
            />
            <Line 
              type="monotone" 
              dataKey="arr" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="ARR (kr)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>

  {/* Detaljerad tabell */}
  <Card>
    <CardHeader>
      <CardTitle>Medlemsföreningar - Detaljerad översikt</CardTitle>
      <CardDescription>
        Data från central MySQL-databas
      </CardDescription>
    </CardHeader>
    <CardContent>
      <DataTable
        columns={memberStatsColumns}
        data={memberStatsData}
        searchable
        exportable
        pagination
      />
    </CardContent>
  </Card>
</div>
```

---

## 🤖 AI-FUNKTIONALITET

### **6. AI-assistent komponenter**

```typescript
// AI Quick Actions (Sidebar widget)
const AIQuickActions = () => {
  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => generateContactPlan()}
      >
        <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
        Föreslå kontaktstrategi
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => analyzeAssociation()}
      >
        <Brain className="mr-2 h-4 w-4 text-purple-500" />
        Analysera förening
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => generateEmailDraft()}
      >
        <Mail className="mr-2 h-4 w-4 text-purple-500" />
        Skriv introduktionsmail
      </Button>

      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => suggestSimilarAssociations()}
      >
        <Users className="mr-2 h-4 w-4 text-purple-500" />
        Hitta liknande föreningar
      </Button>
    </div>
  );
};

// AI Insights component
const AIInsights = ({ association }) => {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights', association.id],
    queryFn: () => generateAIInsights(association),
    staleTime: 1000 * 60 * 30 // Cache 30 min
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        <span className="ml-2 text-sm text-gray-600">
          AI analyserar föreningen...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Engagement score */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">Engagement Score</h4>
          <Badge variant={getScoreBadgeVariant(insights.engagementScore)}>
            {insights.engagementScore}/100
          </Badge>
        </div>
        <Progress value={insights.engagementScore} className="h-2" />
        <p className="text-xs text-gray-600 mt-2">
          {insights.engagementReasoning}
        </p>
      </div>

      {/* Konverteringspotential */}
      <div>
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Konverteringspotential
        </h4>
        <div className="space-y-2">
          {insights.conversionFactors.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${
                factor.positive ? 'bg-green-500' : 'bg-orange-500'
              }`} />
              <p className="text-gray-700">{factor.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rekommenderade nästa steg */}
      <div>
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Föreslagna nästa steg
        </h4>
        <div className="space-y-2">
          {insights.nextSteps.map((step, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left"
              onClick={() => executeAIAction(step.action)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="text-xs">{step.text}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Liknande föreningar */}
      {insights.similarAssociations.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Liknande föreningar
          </h4>
          <div className="space-y-1">
            {insights.similarAssociations.map(similar => (
              <Link
                key={similar.id}
                href={`/associations/${similar.id}`}
                className="block p-2 hover:bg-gray-50 rounded text-sm"
              >
                <p className="font-medium">{similar.name}</p>
                <p className="text-xs text-gray-600">
                  {similar.municipality} · Likhet: {similar.similarity}%
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// AI-powered search suggestions
const AISearchSuggestions = ({ query }) => {
  const { data: suggestions } = useQuery({
    queryKey: ['ai-search-suggestions', query],
    queryFn: () => getAISearchSuggestions(query),
    enabled: query.length > 3
  });

  if (!suggestions?.length) return null;

  return (
    <Card className="absolute top-full mt-2 w-full z-50">
      <CardContent className="p-2">
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600">
          <Sparkles className="h-3 w-3 text-purple-500" />
          AI-förslag
        </div>
        <div className="space-y-1">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              className="w-full text-left px-2 py-2 hover:bg-gray-100 rounded text-sm"
              onClick={() => applyAISuggestion(suggestion)}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 🔄 SCRAPING & DATAIMPORT

### **7. Scraping Dashboard**

```typescript
<div className="p-6 space-y-6">
  
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold">Scraping & Dataimport</h1>
      <p className="text-gray-600">
        Hantera automatisk insamling av föreningsdata från kommuners register
      </p>
    </div>
    <Button onClick={() => setStartScrapeModalOpen(true)}>
      <Play className="mr-2 h-4 w-4" />
      Starta ny scraping
    </Button>
  </div>

  {/* Active scrape runs */}
  <Card>
    <CardHeader>
      <CardTitle>Pågående scraping-jobb</CardTitle>
    </CardHeader>
    <CardContent>
      {activeScrapeRuns.length > 0 ? (
        <div className="space-y-4">
          {activeScrapeRuns.map(run => (
            <div key={run.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{run.municipality}</h3>
                  <p className="text-sm text-gray-600">
                    Startad: {formatDateTime(run.startedAt)}
                  </p>
                </div>
                <Badge variant={
                  run.status === 'running' ? 'default' :
                  run.status === 'completed' ? 'success' :
                  'destructive'
                }>
                  {run.status === 'running' && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  {run.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Framsteg</span>
                  <span>{run.processed} / {run.total} föreningar</span>
                </div>
                <Progress 
                  value={(run.processed / run.total) * 100} 
                  className="h-2"
                />
              </div>

              {run.errors?.length > 0 && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Fel uppstod</AlertTitle>
                  <AlertDescription>
                    {run.errors.length} fel har loggats
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => viewErrors(run.id)}
                    >
                      Visa detaljer
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 mt-3">
                {run.status === 'running' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseScrapeRun(run.id)}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Pausa
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => viewScrapeLog(run.id)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Visa logg
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Inga pågående scraping-jobb</p>
        </div>
      )}
    </CardContent>
  </Card>

  {/* Scrape history */}
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Scraping-historik</CardTitle>
        <Select value={historyFilter} onValueChange={setHistoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla</SelectItem>
            <SelectItem value="completed">Avslutade</SelectItem>
            <SelectItem value="failed">Misslyckade</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kommun</TableHead>
            <TableHead>Startad</TableHead>
            <TableHead>Slutförd</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Funna</TableHead>
            <TableHead>Processade</TableHead>
            <TableHead>Fel</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scrapeHistory.map(run => (
            <TableRow key={run.id}>
              <TableCell className="font-medium">
                {run.municipality}
              </TableCell>
              <TableCell>{formatDateTime(run.startedAt)}</TableCell>
              <TableCell>
                {run.completedAt ? 
                  formatDateTime(run.completedAt) : 
                  '-'
                }
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(run.status)}>
                  {run.status}
                </Badge>
              </TableCell>
              <TableCell>{run.totalFound || '-'}</TableCell>
              <TableCell>{run.totalProcessed || '-'}</TableCell>
              <TableCell>
                {run.errors?.length > 0 ? (
                  <Badge variant="destructive">
                    {run.errors.length}
                  </Badge>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => viewScrapeDetails(run.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visa detaljer
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadScrapeData(run.id)}>
                      <Download className="mr-2 h-4 w-4" />
                      Ladda ner data
                    </DropdownMenuItem>
                    {run.status === 'failed' && (
                      <DropdownMenuItem onClick={() => retryScrape(run.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Försök igen
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>

  {/* Scheduled scrapes */}
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Schemalagda scraping-jobb</CardTitle>
        <Button 
          variant="outline" 
          onClick={() => setScheduleModalOpen(true)}
        >
          <Clock className="mr-2 h-4 w-4" />
          Lägg till schema
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {scheduledScrapes.map(schedule => (
          <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">{schedule.name}</p>
                <p className="text-sm text-gray-600">
                  {schedule.municipalities.join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Körs: {schedule.cron} ({describeCron(schedule.cron)})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={schedule.enabled}
                onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => editSchedule(schedule.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Redigera
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => runScheduleNow(schedule.id)}>
                    <Play className="mr-2 h-4 w-4" />
                    Kör nu
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => deleteSchedule(schedule.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Ta bort
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</div>
```

