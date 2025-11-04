/**
 * @fileoverview Minimal client wrapper for the Loopia-compatible PHP API.
 * Replaces previous tRPC/Express calls with same-origin fetch requests.
 * All methods include Google-style docstrings and basic error handling.
 */

import { resolveApiUrl } from '@/lib/api-base'
import { ensureCsrfToken } from '@/lib/csrf'
import { CSRF_HEADER_NAME } from '@/lib/security/constants'

const RELATIVE_ORIGIN_FALLBACK = 'http://localhost:3000'

type SearchParamPrimitive = string | number | boolean | null | undefined

type SearchParamRecord = Record<string, SearchParamPrimitive | SearchParamPrimitive[]>

export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

interface JsonFetchOptions extends RequestInit {
  searchParams?: SearchParamRecord
  requiresCsrf?: boolean
  expectJson?: boolean
}

function buildUrl(path: string, searchParams?: SearchParamRecord): string {
  const resolved = resolveApiUrl(path)
  const base = resolved.startsWith('http://') || resolved.startsWith('https://')
    ? resolved
    : typeof window === 'undefined'
      ? new URL(resolved, RELATIVE_ORIGIN_FALLBACK).toString()
      : new URL(resolved, window.location.origin).toString()

  if (!searchParams) {
    return base
  }

  const url = new URL(base)
  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (rawValue === null || rawValue === undefined) {
      continue
    }

    if (Array.isArray(rawValue)) {
      for (const value of rawValue) {
        if (value === null || value === undefined) continue
        url.searchParams.append(key, String(value))
      }
      continue
    }

    url.searchParams.append(key, String(rawValue))
  }

  return url.toString()
}

async function ensureCsrf(): Promise<string> {
  const token = await ensureCsrfToken(() =>
    fetch(resolveApiUrl('/api/csrf.php'), {
      method: 'GET',
      credentials: 'include',
    }),
  )

  if (!token) {
    throw new Error('Kunde inte hämta CSRF-token')
  }

  return token
}

async function jsonFetch<T = unknown>(path: string, options: JsonFetchOptions = {}): Promise<T> {
  const { searchParams, requiresCsrf, headers, body, expectJson = true, ...rest } = options
  const url = buildUrl(path, searchParams)
  const requestHeaders = new Headers(headers)

  if (requiresCsrf) {
    const token = await ensureCsrf()
    requestHeaders.set(CSRF_HEADER_NAME, token)
  }

  let payload: BodyInit | undefined = undefined
  if (body instanceof FormData || body instanceof URLSearchParams || typeof body === 'string' || body instanceof Blob) {
    payload = body
  } else if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json; charset=utf-8')
    payload = JSON.stringify(body)
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers: requestHeaders,
    body: payload,
    ...rest,
  })

  if (!expectJson) {
    if (!response.ok) {
      throw new ApiError(`HTTP ${response.status}`, response.status, null)
    }
    return undefined as T
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch (error) {
      throw new ApiError(`Invalid JSON från ${path}`, response.status, {
        raw: text,
        error: error instanceof Error ? error.message : 'unknown',
      })
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message: unknown }).message)
          : `HTTP ${response.status}`
    throw new ApiError(message, response.status, data)
  }

  return data as T
}

export interface Pagination {
  page?: number
  pageSize?: number
  sort?: 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc'
}

export interface AssocFilters extends Pagination {
  q?: string
  municipality?: string
  type?: string
  status?: string
  tags?: string[]
}

export interface Association {
  id: number
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
  [key: string]: unknown
}

export interface Note {
  id: number
  association_id: number
  content: string
  author: string | null
  created_at: string
}

export interface Tag {
  id: number
  name: string
  color?: string | null
}

export interface Municipality {
  id: number
  name: string
  code: string | null
  countyCode?: string | null
  population?: number | null
  registerUrl?: string | null
  [key: string]: unknown
}

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface SessionUser {
  id: number | string
  email: string | null
  name?: string | null
  role?: string | null
}

export interface SessionResponse {
  authenticated: boolean
  user?: SessionUser
}

export interface LoginResponse {
  success: boolean
  user?: SessionUser
  error?: string
}

export interface MutationResponse {
  success: boolean
  message?: string
}

/**
 * Hämtar aktiv session från PHP-backendet.
 */
export async function getSession(): Promise<SessionResponse> {
  return await jsonFetch<SessionResponse>('/api/session.php', { method: 'GET' })
}

/**
 * Försöker logga in användaren med angivna uppgifter.
 */
export async function login(
  email: string,
  password: string,
  init?: { headers?: HeadersInit },
): Promise<LoginResponse> {
  return await jsonFetch<LoginResponse>('/api/login.php', {
    method: 'POST',
    headers: init?.headers,
    body: { email, password },
  })
}

/**
 * Loggar ut den aktiva användaren och avslutar sessionen.
 */
export async function logout(init?: { headers?: HeadersInit }): Promise<MutationResponse> {
  return await jsonFetch<MutationResponse>('/api/logout.php', {
    method: 'POST',
    headers: init?.headers,
    requiresCsrf: true,
  })
}

/**
 * Hämtar en lista med föreningar baserat på angivna filter.
 */
export async function getAssociations(filters: AssocFilters = {}): Promise<ListResponse<Association>> {
  return await jsonFetch<ListResponse<Association>>('/api/associations.php', {
    method: 'GET',
    searchParams: {
      q: filters.q,
      municipality: filters.municipality,
      type: filters.type,
      status: filters.status,
      page: filters.page,
      pageSize: filters.pageSize,
      sort: filters.sort,
      ...(filters.tags ? { 'tags[]': filters.tags } : {}),
    },
  })
}

/**
 * Hämtar en specifik förening via ID.
 */
export async function getAssociationById(id: number): Promise<Association> {
  return await jsonFetch<Association>('/api/associations.php', {
    method: 'GET',
    searchParams: { id },
  })
}

/**
 * Skapar en ny förening.
 */
export async function createAssociation(payload: Partial<Association>): Promise<Association> {
  return await jsonFetch<Association>('/api/associations.php', {
    method: 'POST',
    requiresCsrf: true,
    body: payload,
  })
}

/**
 * Uppdaterar en befintlig förening.
 */
export async function updateAssociation(id: number, payload: Partial<Association>): Promise<Association> {
  return await jsonFetch<Association>('/api/associations.php', {
    method: 'PUT',
    requiresCsrf: true,
    searchParams: { id },
    body: payload,
  })
}

/**
 * Mjuk-raderar en förening.
 */
export async function deleteAssociation(id: number): Promise<MutationResponse> {
  return await jsonFetch<MutationResponse>('/api/associations.php', {
    method: 'DELETE',
    requiresCsrf: true,
    searchParams: { id },
  })
}

/**
 * Hämtar anteckningar för en förening.
 */
export async function getAssociationNotes(associationId: number): Promise<Note[]> {
  return await jsonFetch<Note[]>('/api/association_notes.php', {
    method: 'GET',
    searchParams: { associationId },
  })
}

/**
 * Skapar en ny anteckning kopplad till en förening.
 */
export async function addAssociationNote(associationId: number, content: string): Promise<Note> {
  return await jsonFetch<Note>('/api/association_notes.php', {
    method: 'POST',
    requiresCsrf: true,
    body: { associationId, content },
  })
}

/**
 * Hämtar alla taggar.
 */
export async function getTags(): Promise<Tag[]> {
  return await jsonFetch<Tag[]>('/api/tags.php', { method: 'GET' })
}

/**
 * Skapar en ny tagg.
 */
export async function createTag(name: string, color?: string | null): Promise<Tag> {
  return await jsonFetch<Tag>('/api/tags.php', {
    method: 'POST',
    requiresCsrf: true,
    body: { name, color },
  })
}

/**
 * Kopplar en tagg till en förening.
 */
export async function attachTagToAssociation(associationId: number, tagId: number): Promise<MutationResponse> {
  return await jsonFetch<MutationResponse>('/api/tags.php', {
    method: 'POST',
    requiresCsrf: true,
    body: { action: 'attach', associationId, tagId },
  })
}

/**
 * Tar bort kopplingen mellan en tagg och en förening.
 */
export async function detachTagFromAssociation(associationId: number, tagId: number): Promise<MutationResponse> {
  return await jsonFetch<MutationResponse>('/api/tags.php', {
    method: 'DELETE',
    requiresCsrf: true,
    body: { associationId, tagId },
  })
}

/**
 * Hämtar listan över kommuner.
 */
export async function getMunicipalities(): Promise<Municipality[]> {
  return await jsonFetch<Municipality[]>('/api/municipalities.php', { method: 'GET' })
}

/**
 * Exporterar gruppmedlemmar till CSV.
 */
export async function exportGroupMembers(groupId: number): Promise<Blob> {
  const response = await fetch(buildUrl('/api/groups.php', { id: groupId, action: 'export' }), {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status, null)
  }

  return await response.blob()
}

/**
 * Tvingar fram en CSRF-cookie inför skrivoperationer.
 */
export async function ensureCsrfCookie(): Promise<string> {
  return await ensureCsrf()
}
