/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Minimal fetch-based client for the Loopia-compatible PHP API.
 * Replaces previous tRPC usage with typed helper functions built on top of
 * `fetch` and same-origin endpoints.
 */

const CSRF_COOKIE_NAME = 'csrf'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

type AssocID = number

type SortOrder = 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc'

type PaginationInput = {
  page?: number
  pageSize?: number
  sort?: SortOrder
}

export interface AssociationFilters extends PaginationInput {
  q?: string
  municipality?: string
  type?: string
  status?: string
  tags?: string[]
}

export interface AssociationRecord {
  id: AssocID
  name: string
  municipality_id: number | null
  type: string | null
  status: string | null
  email: string | null
  phone: string | null
  address: string | null
  website: string | null
  description: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AssociationInput {
  name: string
  municipality_id?: number | null
  type?: string | null
  status?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  description?: string | null
  tags?: (string | number)[]
}

export interface NoteRecord {
  id: number
  association_id: AssocID
  content: string
  author: string | null
  created_at: string
}

export interface NoteInput {
  associationId: AssocID
  content: string
  author?: string | null
}

export interface TagRecord {
  id: number
  name: string
}

export interface TagInput {
  name: string
}

export interface MunicipalityRecord {
  id: number
  name: string
  code: string | null
}

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

function getDocument(): Document | null {
  if (typeof document === 'undefined') {
    return null
  }
  return document
}

function readCookie(name: string): string | null {
  const doc = getDocument()
  if (!doc) return null
  const pattern = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`) // eslint-disable-line prefer-template
  const match = doc.cookie.match(pattern)
  return match ? decodeURIComponent(match[1]) : null
}

async function ensureCsrfCookie(): Promise<void> {
  if (readCookie(CSRF_COOKIE_NAME)) return
  const response = await fetch('/api/csrf.php', {
    method: 'GET',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`Failed to obtain CSRF token: ${response.status}`)
  }
}

async function jsonFetch<T = any>(
  url: string,
  init: RequestInit = {},
  options: { needsCsrf?: boolean } = {},
): Promise<T> {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    ...(init.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init.headers),
  })

  if (options.needsCsrf) {
    await ensureCsrfCookie()
    const token = readCookie(CSRF_COOKIE_NAME)
    if (!token) {
      throw new Error('Unable to resolve CSRF token')
    }
    headers.set(CSRF_HEADER_NAME, token)
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  })

  const text = await response.text()
  const data = text.length > 0 ? (() => {
    try {
      return JSON.parse(text)
    } catch (error) {
      throw new Error(`Invalid JSON response from ${url}: ${text.slice(0, 200)}`)
    }
  })() : null

  if (!response.ok) {
    const message = (data && (data.error || data.message)) ?? `HTTP ${response.status}`
    throw new Error(message)
  }

  return data as T
}

function buildQuery(params: Record<string, string | string[] | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    if (Array.isArray(value)) {
      value.forEach((entry) => searchParams.append(`${key}[]`, String(entry)))
    } else if (value.length > 0) {
      searchParams.set(key, value)
    }
  })
  const queryString = searchParams.toString()
  return queryString.length > 0 ? `?${queryString}` : ''
}

export const api = {
  /**
   * Logs in the single administrator user.
   *
   * @param email - User email address.
   * @param password - Plain text password to verify server-side.
   * @returns Promise resolving with `{ ok: true }` when login succeeds.
   */
  async login(email: string, password: string): Promise<{ ok: boolean }> {
    const body = JSON.stringify({ email, password })
    return jsonFetch('/api/login.php', { method: 'POST', body }, { needsCsrf: true })
  },

  /**
   * Logs out the current authenticated session.
   *
   * @returns Promise resolving with `{ ok: true }` when session is terminated.
   */
  async logout(): Promise<{ ok: boolean }> {
    const body = JSON.stringify({})
    return jsonFetch('/api/logout.php', { method: 'POST', body }, { needsCsrf: true })
  },

  /**
   * Retrieves associations with optional filters and pagination controls.
   *
   * @param filters - Text search, tag, municipality, and pagination filters.
   * @returns Paginated association list response from the API.
   */
  async getAssociations(filters: AssociationFilters = {}): Promise<ListResponse<AssociationRecord>> {
    const query = buildQuery({
      q: filters.q,
      municipality: filters.municipality,
      type: filters.type,
      status: filters.status,
      tags: filters.tags,
      page: filters.page ? String(filters.page) : undefined,
      pageSize: filters.pageSize ? String(filters.pageSize) : undefined,
      sort: filters.sort,
    })

    return jsonFetch(`/api/associations.php${query}`)
  },

  /**
   * Fetches an individual association by its identifier.
   *
   * @param id - Association identifier.
   * @returns Association record matching the identifier.
   */
  async getAssociationById(id: AssocID): Promise<AssociationRecord> {
    return jsonFetch(`/api/associations.php?id=${encodeURIComponent(String(id))}`)
  },

  /**
   * Creates a new association.
   *
   * @param input - Association payload (name, contact info, optional tags).
   * @returns Newly created association record.
   */
  async createAssociation(input: AssociationInput): Promise<AssociationRecord> {
    const body = JSON.stringify(input)
    return jsonFetch('/api/associations.php', { method: 'POST', body }, { needsCsrf: true })
  },

  /**
   * Updates an existing association record.
   *
   * @param id - Association identifier to update.
   * @param input - Partial payload with fields to update.
   * @returns Updated association record.
   */
  async updateAssociation(id: AssocID, input: Partial<AssociationInput>): Promise<AssociationRecord> {
    const body = JSON.stringify({ id, ...input })
    return jsonFetch(`/api/associations.php?id=${encodeURIComponent(String(id))}`, { method: 'PUT', body }, { needsCsrf: true })
  },

  /**
   * Soft deletes an association by marking `deleted_at` server-side.
   *
   * @param id - Association identifier to delete.
   * @returns Confirmation object when deletion succeeds.
   */
  async deleteAssociation(id: AssocID): Promise<{ ok: boolean }> {
    return jsonFetch(`/api/associations.php?id=${encodeURIComponent(String(id))}`, { method: 'DELETE' }, { needsCsrf: true })
  },

  /**
   * Lists notes connected to a specific association.
   *
   * @param associationId - Association identifier.
   * @returns Array of note records ordered by creation timestamp.
   */
  async getAssociationNotes(associationId: AssocID): Promise<NoteRecord[]> {
    return jsonFetch(`/api/association_notes.php?associationId=${encodeURIComponent(String(associationId))}`)
  },

  /**
   * Adds a new note for an association.
   *
   * @param input - Note payload including association id and content.
   * @returns Newly created note record.
   */
  async addAssociationNote(input: NoteInput): Promise<NoteRecord> {
    const body = JSON.stringify({
      associationId: input.associationId,
      content: input.content,
      author: input.author ?? null,
    })
    return jsonFetch('/api/association_notes.php', { method: 'POST', body }, { needsCsrf: true })
  },

  /**
   * Fetches all available tags.
   *
   * @returns Array of tag records.
   */
  async getTags(): Promise<TagRecord[]> {
    return jsonFetch('/api/tags.php')
  },

  /**
   * Creates a new tag entry.
   *
   * @param input - Tag payload containing a unique name.
   * @returns Newly created tag record.
   */
  async createTag(input: TagInput): Promise<TagRecord> {
    const body = JSON.stringify(input)
    return jsonFetch('/api/tags.php', { method: 'POST', body }, { needsCsrf: true })
  },

  /**
   * Attaches a tag to an association via the join table.
   *
   * @param associationId - Association identifier.
   * @param tagId - Tag identifier to attach.
   * @returns Confirmation payload when attachment succeeds.
   */
  async attachTag(associationId: AssocID, tagId: number): Promise<{ ok: boolean }> {
    const body = JSON.stringify({ associationId, tagId })
    return jsonFetch('/api/tags.php?action=attach', { method: 'POST', body }, { needsCsrf: true })
  },

  /**
   * Removes a tag from an association join entry.
   *
   * @param associationId - Association identifier.
   * @param tagId - Tag identifier to remove.
   * @returns Confirmation payload when detachment succeeds.
   */
  async detachTag(associationId: AssocID, tagId: number): Promise<{ ok: boolean }> {
    const body = JSON.stringify({ associationId, tagId })
    return jsonFetch('/api/tags.php?action=detach', { method: 'DELETE', body }, { needsCsrf: true })
  },

  /**
   * Lists all municipalities used for filtering.
   *
   * @returns Array of municipality records.
   */
  async getMunicipalities(): Promise<MunicipalityRecord[]> {
    return jsonFetch('/api/municipalities.php')
  },
}

export type ApiClient = typeof api
