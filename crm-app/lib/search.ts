type SearchFilters = {
  municipality?: string
  crmStatuses?: string[]
  pipelines?: string[]
  types?: string[]
  activities?: string[]
  tags?: string[]
  isMember?: boolean
}

type SearchParams = {
  query?: string | null
  filters: SearchFilters
  page: number
  limit: number
}

type SearchResponse = {
  ids: string[]
  estimatedTotalHits?: number
}

export interface SearchClient {
  search(params: SearchParams): Promise<SearchResponse | null>
}

const buildFilterString = (filters: SearchFilters) => {
  const parts: string[] = []

  if (filters.municipality) {
    parts.push(`municipality:${JSON.stringify(filters.municipality)}`)
  }

  if (filters.crmStatuses?.length) {
    parts.push(`crmStatus:=[${filters.crmStatuses.map((v) => JSON.stringify(v)).join(',')}]`)
  }

  if (filters.pipelines?.length) {
    parts.push(`pipeline:=[${filters.pipelines.map((v) => JSON.stringify(v)).join(',')}]`)
  }

  if (filters.types?.length) {
    parts.push(`types:=[${filters.types.map((v) => JSON.stringify(v)).join(',')}]`)
  }

  if (filters.activities?.length) {
    parts.push(`activities:=[${filters.activities.map((v) => JSON.stringify(v)).join(',')}]`)
  }

  if (filters.tags?.length) {
    parts.push(`tags:=[${filters.tags.map((v) => JSON.stringify(v)).join(',')}]`)
  }

  if (typeof filters.isMember === 'boolean') {
    parts.push(`isMember:${filters.isMember}`)
  }

  return parts.join(' && ')
}

class TypesenseClient implements SearchClient {
  constructor(private readonly config: { host: string; apiKey: string; protocol: string }) {}

  async search(params: SearchParams): Promise<SearchResponse | null> {
    const url = new URL(`/collections/associations/documents/search`, `${this.config.protocol}://${this.config.host}`)
    const filterBy = buildFilterString(params.filters)
    const queryParams: Record<string, string> = {
      q: params.query ?? '*',
      query_by: 'name,city,municipality',
      page: params.page.toString(),
      per_page: params.limit.toString(),
    }

    if (filterBy) {
      queryParams.filter_by = filterBy
    }

    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    const response = await fetch(url, {
      headers: {
        'X-TYPESENSE-API-KEY': this.config.apiKey,
      },
    })

    if (!response.ok) {
      console.warn('Typesense search failed', await response.text())
      return null
    }

    const data = (await response.json()) as { hits: Array<{ document: { id: string } }>;
      found: number }

    return {
      ids: data.hits?.map((hit) => hit.document.id) ?? [],
      estimatedTotalHits: data.found,
    }
  }
}

class MeilisearchClient implements SearchClient {
  constructor(private readonly config: { host: string; apiKey?: string }) {}

  async search(params: SearchParams): Promise<SearchResponse | null> {
    const url = new URL('/indexes/associations/search', this.config.host)

    const filterExpressions: string[] = []

    if (params.filters.municipality) {
      filterExpressions.push(`municipality = "${params.filters.municipality}"`)
    }

    if (params.filters.crmStatuses?.length) {
      filterExpressions.push(
        params.filters.crmStatuses.map((status) => `crmStatus = "${status}"`).join(' OR ')
      )
    }

    if (params.filters.types?.length) {
      filterExpressions.push(params.filters.types.map((type) => `types = "${type}"`).join(' OR '))
    }

    if (params.filters.tags?.length) {
      filterExpressions.push(params.filters.tags.map((tag) => `tags = "${tag}"`).join(' OR '))
    }

    if (typeof params.filters.isMember === 'boolean') {
      filterExpressions.push(`isMember = ${params.filters.isMember}`)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        q: params.query ?? '',
        page: params.page,
        hitsPerPage: params.limit,
        filter: filterExpressions.length ? filterExpressions : undefined,
      }),
    })

    if (!response.ok) {
      console.warn('Meilisearch failed', await response.text())
      return null
    }

    const data = (await response.json()) as { hits: Array<{ id: string }>; estimatedTotalHits?: number }

    return {
      ids: data.hits?.map((hit) => hit.id) ?? [],
      estimatedTotalHits: data.estimatedTotalHits,
    }
  }
}

let cachedClient: SearchClient | null | undefined

export const getSearchClient = (): SearchClient | null => {
  if (typeof window !== 'undefined') {
    return null
  }

  if (cachedClient !== undefined) {
    return cachedClient
  }

  const provider = process.env.SEARCH_PROVIDER?.toLowerCase()

  if (provider === 'typesense') {
    const host = process.env.TYPESENSE_HOST
    const apiKey = process.env.TYPESENSE_API_KEY
    const protocol = process.env.TYPESENSE_PROTOCOL ?? 'https'

    if (!host || !apiKey) {
      console.warn('Typesense configured as provider but missing host or api key')
      cachedClient = null
      return cachedClient
    }

    cachedClient = new TypesenseClient({ host, apiKey, protocol })
    return cachedClient
  }

  if (provider === 'meilisearch') {
    const host = process.env.MEILISEARCH_HOST
    if (!host) {
      console.warn('Meilisearch configured as provider but missing host')
      cachedClient = null
      return cachedClient
    }

    cachedClient = new MeilisearchClient({ host, apiKey: process.env.MEILISEARCH_API_KEY })
    return cachedClient
  }

  cachedClient = null
  return cachedClient
}
