# 1) Skapa patchfil
@"
*** Begin Patch
*** Update File: crm-app/lib/search.ts
@@
 class TypesenseClient implements SearchClient {
   async search(params: SearchParams): Promise<SearchResponse<AssociationSearchDoc>> {
     const filterBy = buildFilterString(params.filters)
     const queryParams: Record<string, string> = {
       q: params.query ?? '*',
-      query_by: 'name,city,municipality',
+      // Include taxonomy/array fields in external search:
+      // name, city, municipality, types, activities, categories, tags
+      query_by: 'name,city,municipality,types,activities,categories,tags',
       page: params.page.toString(),
       per_page: params.limit.toString(),
     }
@@
 class MeilisearchClient implements SearchClient {
   async search(params: SearchParams): Promise<SearchResponse<AssociationSearchDoc>> {
     const filterExpressions = buildMeiliFilters(params.filters)
     const indexName = 'associations'
     const res = await this.client.index(indexName).search(params.query ?? '', {
       page: params.page,
       hitsPerPage: params.limit,
       filter: filterExpressions.length ? filterExpressions : undefined,
+      // Let Meili search across the same fields
+      attributesToSearchOn: ['name', 'city', 'municipality', 'types', 'activities', 'categories', 'tags'],
     })
*** End Patch
"@ | Set-Content -NoNewline crm-app\lib\add-external-fields.patch

# 2) Applicera patchen
git apply --whitespace=fix crm-app\lib\add-external-fields.patch

# 3) Committa
git add crm-app/lib/search.ts
git commit -m "Cherry-pick (#14): external search fields (types, activities, categories, tags) for Typesense/Meili"

# 4) (städ) Ta bort temporära filer om du vill
del crm-app\lib\search.pr14.ts -ErrorAction SilentlyContinue
del crm-app\lib\add-external-fields.patch -ErrorAction SilentlyContinue
