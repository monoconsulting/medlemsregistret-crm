/**
 * @fileoverview Minimal client wrapper for the Loopia-compatible PHP API.
 * Replaces previous tRPC/Express calls with same-origin (or configured-origin)
 * fetch requests. All methods include Google-style docstrings and basic error
 * handling.
 */

import { resolveBackendUrl } from "@/lib/backend-base"

type JsonSerializableObject = Record<string, unknown> | Array<unknown> | null

type JsonBody = BodyInit | JsonSerializableObject | undefined

interface JsonRequestInit extends Omit<RequestInit, "body"> {
  body?: JsonBody
}

type AssocID = string;

export type AuthRole = 'ADMIN' | 'MANAGER' | 'USER' | string;

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  role: AuthRole;
}

export interface AuthSession {
  user: AuthUser;
}

export interface Pagination {
  page?: number;
  pageSize?: number;
  sort?: 'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc';
}

export interface AssocFilters extends Pagination {
  q?: string;
  municipality?: string;
  type?: string;
  status?: string;
  tags?: string[]; // tag names or IDs (backend accepts both, see PHP)
}

export interface Association {
  id: AssocID;
  name: string;
  municipality_id: string | null;
  municipality_name?: string | null;
  type: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tags?: Tag[];
}

export interface Note {
  id: string;
  association_id: AssocID;
  content: string;
  author: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Municipality {
  id: string;
  name: string;
  code: string | null;
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Reads the CSRF token from the `csrf` cookie.
 *
 * Returns:
 *   string | null: The CSRF token value if present, otherwise null.
 */
function getCsrfFromCookie(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Ensures CSRF cookie exists by calling the CSRF endpoint when missing.
 * This avoids 403 on first write request in a fresh session.
 *
 * Returns:
 *   Promise<void>
 */
async function ensureCsrf(force = false): Promise<void> {
  if (getCsrfFromCookie() && !force) return;
  const res = await fetch(resolveBackendUrl('/api/csrf.php'), { method: 'GET', credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Failed to obtain CSRF: ${res.status}`);
  }
}

/**
 * Performs a JSON fetch to the given endpoint with optional body.
 *
 * Args:
 *   url: string - API path (same-origin), e.g., '/api/associations.php'
 *   options: RequestInit - fetch options (method, body, etc.)
 *   needsCsrf: boolean - whether to attach X-CSRF-Token header.
 *
 * Returns:
 *   Promise<any>: Parsed JSON response.
 */
async function jsonFetch(url: string, options: JsonRequestInit = {}, needsCsrf = false): Promise<any> {
  const target = resolveBackendUrl(url);
  const { body: rawBody, headers: rawHeaders, ...rest } = options;
  const baseInit: RequestInit = {
    ...rest,
    credentials: 'include',
  };

  const execute = async (forceCsrf: boolean, hasRetried: boolean): Promise<any> => {
    const headers = new Headers(rawHeaders as HeadersInit | undefined);
    const init: RequestInit = { ...baseInit };

    if (needsCsrf) {
      await ensureCsrf(forceCsrf);
      const token = getCsrfFromCookie();
      if (!token) throw new Error('Missing CSRF token after ensureCsrf()');
      headers.set('X-CSRF-Token', token);
    }

    const body = rawBody;
    const hasCustomContentType = headers.has('Content-Type');
    const isReadableStream =
      typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
    const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;
    const isSpecialBody =
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof Blob ||
      isArrayBuffer ||
      isReadableStream ||
      typeof body === 'string';

    if (body !== undefined) {
      if (!isSpecialBody) {
        if (!hasCustomContentType) {
          headers.set('Content-Type', 'application/json; charset=utf-8');
        }
        init.body = JSON.stringify(body);
      } else {
        init.body = body as BodyInit;
      }
    }

    init.headers = headers;

    const res = await fetch(target, init);
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Invalid JSON from ${url}: ${text?.slice(0, 200)}`);
    }
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      const msgLower = typeof msg === 'string' ? msg.toLowerCase() : '';
      if (needsCsrf && !hasRetried && msgLower.includes('csrf')) {
        return execute(true, true);
      }
      throw new Error(msg);
    }
    return data;
  };

  return execute(false, false);
}

export const api = {
  /**
   * Logs in the single user.
   *
   * Args:
   *   email: string - user email.
   *   password: string - user password (bcrypt-hashed on server).
   *
   * Returns:
   *   Promise<{ok: boolean}>: ok true if login succeeded.
   */
  async login(email: string, password: string): Promise<{ ok: boolean }> {
    const body = { email, password };
    return jsonFetch('/api/login.php', { method: 'POST', body }, true);
  },

  /**
   * Retrieves the current authenticated session user, if any.
   *
   * Returns:
   *   Promise<AuthSession | null>
   */
  async getSession(): Promise<AuthSession | null> {
    const data = await jsonFetch('/api/auth/me.php', { method: 'GET' });
    const rawUser = data?.user;
    if (!rawUser || !rawUser.id) {
      return null;
    }

    const role =
      typeof rawUser.role === 'string' && rawUser.role
        ? (rawUser.role.toUpperCase() as AuthRole)
        : 'USER';

    return {
      user: {
        id: String(rawUser.id),
        email: rawUser.email ?? null,
        name: rawUser.name ?? null,
        role,
      },
    };
  },

  /**
   * Logs out the current session.
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async logout(): Promise<{ ok: boolean }> {
    return jsonFetch('/api/logout.php', { method: 'POST', body: {} }, true);
  },

  /**
   * Fetches a paginated list of associations with filters.
   *
   * Args:
   *   filters: AssocFilters - search and filter parameters.
   *
   * Returns:
   *   Promise<ListResponse<Association>>
   */
  async getAssociations(filters: AssocFilters = {}): Promise<ListResponse<Association>> {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.municipality) params.set('municipality', filters.municipality);
    if (filters.type) params.set('type', filters.type);
    if (filters.status) params.set('status', filters.status);
    if (filters.tags?.length) filters.tags.forEach(t => params.append('tags[]', t));
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.sort) params.set('sort', filters.sort);

    return jsonFetch(`/api/associations.php?${params.toString()}`, { method: 'GET' });
  },

  /**
   * Creates a new association.
   *
   * Args:
   *   data: Partial<Association> - fields to set at creation.
   *
   * Returns:
   *   Promise<{id: number}>
   */
  async createAssociation(data: Partial<Association>): Promise<{ id: AssocID }> {
    return jsonFetch('/api/associations.php', { method: 'POST', body: data }, true);
  },

  /**
   * Updates an existing association by ID.
   *
   * Args:
   *   id: number - association ID
   *   patch: Partial<Association> - fields to update
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async updateAssociation(id: AssocID, patch: Partial<Association>): Promise<{ ok: boolean }> {
    const body = { id, ...patch };
    return jsonFetch('/api/associations.php', { method: 'PUT', body }, true);
  },

  /**
   * Soft-deletes an association (sets deleted_at).
   *
   * Args:
   *   id: number - association ID
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async deleteAssociation(id: AssocID): Promise<{ ok: boolean }> {
    return jsonFetch(`/api/associations.php?id=${encodeURIComponent(String(id))}`, { method: 'DELETE' }, true);
  },

  /**
   * Lists tags.
   *
   * Returns:
   *   Promise<Tag[]>
   */
  async getTags(): Promise<Tag[]> {
    const res = await jsonFetch('/api/tags.php', { method: 'GET' });
    return res.items as Tag[];
  },

  /**
   * Creates a tag.
   *
   * Args:
   *   name: string - tag name
   *
   * Returns:
   *   Promise<{id: number}>
   */
  async createTag(name: string): Promise<{ id: string }> {
    return jsonFetch('/api/tags.php', { method: 'POST', body: { name } }, true);
  },

  /**
   * Attaches a tag to an association.
   *
   * Args:
   *   associationId: number
   *   tagId: number
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async attachTag(associationId: AssocID, tagId: string): Promise<{ ok: boolean }> {
    return jsonFetch('/api/tags.php', { method: 'POST', body: { action: 'attach', associationId, tagId } }, true);
  },

  /**
   * Detaches a tag from an association.
   *
   * Args:
   *   associationId: number
   *   tagId: number
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async detachTag(associationId: AssocID, tagId: string): Promise<{ ok: boolean }> {
    return jsonFetch('/api/tags.php', { method: 'POST', body: { action: 'detach', associationId, tagId } }, true);
  },

  /**
   * Lists municipalities for filter dropdowns.
   *
   * Returns:
   *   Promise<Municipality[]>
   */
  async getMunicipalities(): Promise<Municipality[]> {
    const res = await jsonFetch('/api/municipalities.php', { method: 'GET' });
    return res.items as Municipality[];
  },

  /**
   * Lists notes for an association.
   *
   * Args:
   *   associationId: number
   *
   * Returns:
   *   Promise<Note[]>
   */
  async getNotes(associationId: AssocID): Promise<Note[]> {
    const res = await jsonFetch(`/api/association_notes.php?association_id=${encodeURIComponent(String(associationId))}`, { method: 'GET' });
    return res.items as Note[];
  },

  /**
   * Adds a note to an association.
   *
   * Args:
   *   associationId: number
   *   content: string
   *
   * Returns:
   *   Promise<{id: number}>
   */
  async addNote(associationId: AssocID, content: string): Promise<{ id: string }> {
    return jsonFetch('/api/association_notes.php', { method: 'POST', body: { association_id: associationId, content } }, true);
  },
};
