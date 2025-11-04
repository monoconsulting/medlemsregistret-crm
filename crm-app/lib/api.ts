/**
 * @fileoverview Minimal client wrapper for the Loopia-compatible PHP API.
 * Replaces previous tRPC/Express calls with same-origin fetch requests.
 * All methods include Google-style docstrings and basic error handling.
 */

type AssocID = number;

export const UNAUTHORIZED_EVENT = 'crm-auth-unauthorized';

interface JsonFetchOptions extends RequestInit {
  /**
   * When true, prevents automatic unauthorized redirect/notification.
   * Useful for endpoints (like login) that legitimately respond with 401.
   */
  suppressUnauthorizedRedirect?: boolean;
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
  municipality_id: number | null;
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
  id: number;
  association_id: AssocID;
  content: string;
  author: string | null;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Municipality {
  id: number;
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
async function ensureCsrf(): Promise<void> {
  if (getCsrfFromCookie()) return;
  const res = await fetch('/api/csrf.php', { method: 'GET', credentials: 'include' });
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
 *   Promise<T>: Parsed JSON response typed by caller.
 */
async function jsonFetch<T = unknown>(
  url: string,
  options: JsonFetchOptions = {},
  needsCsrf = false,
): Promise<T> {
  const { suppressUnauthorizedRedirect = false, headers: overrideHeaders, ...rest } = options;

  const headers = new Headers(overrideHeaders as HeadersInit | undefined);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  const init: RequestInit = {
    credentials: 'include',
    ...rest,
    headers,
  };

  if (needsCsrf) {
    await ensureCsrf();
    const token = getCsrfFromCookie();
    if (!token) throw new Error('Missing CSRF token after ensureCsrf()');
    headers.set('X-CSRF-Token', token);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text for debugging
    throw new Error(`Invalid JSON from ${url}: ${text?.slice(0, 200)}`);
  }
  if (!res.ok) {
    const payload = (data ?? null) as Record<string, unknown> | null;
    const payloadError =
      typeof payload?.error === 'string'
        ? payload.error
        : typeof payload?.message === 'string'
          ? payload.message
          : null;
    const msg = payloadError ?? `HTTP ${res.status}`;

    if (typeof window !== 'undefined' && (res.status === 401 || res.status === 403) && !suppressUnauthorizedRedirect) {
      const detail = {
        status: res.status,
        url,
        timestamp: Date.now(),
      } as const;
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail }));
    }

    const error = new Error(msg) as Error & { status?: number; payload?: unknown };
    error.status = res.status;
    error.payload = data;
    throw error;
  }
  return data as T;
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
    return jsonFetch<{ ok: boolean }>(
      '/api/login.php',
      { method: 'POST', body: JSON.stringify(body), suppressUnauthorizedRedirect: true },
      true,
    );
  },

  /**
   * Logs out the current session.
   *
   * Returns:
   *   Promise<{ok: boolean}>
   */
  async logout(): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>('/api/logout.php', { method: 'POST', body: JSON.stringify({}) }, true);
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

    return jsonFetch<ListResponse<Association>>(`/api/associations.php?${params.toString()}`, { method: 'GET' });
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
  async createAssociation(data: Partial<Association>): Promise<{ id: number }> {
    return jsonFetch<{ id: number }>('/api/associations.php', { method: 'POST', body: JSON.stringify(data) }, true);
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
  async updateAssociation(id: number, patch: Partial<Association>): Promise<{ ok: boolean }> {
    const body = { id, ...patch };
    return jsonFetch<{ ok: boolean }>('/api/associations.php', { method: 'PUT', body: JSON.stringify(body) }, true);
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
  async deleteAssociation(id: number): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>(
      `/api/associations.php?id=${encodeURIComponent(String(id))}`,
      { method: 'DELETE' },
      true,
    );
  },

  /**
   * Lists tags.
   *
   * Returns:
   *   Promise<Tag[]>
   */
  async getTags(): Promise<Tag[]> {
    const res = await jsonFetch<{ items: Tag[] }>('/api/tags.php', { method: 'GET' });
    return res.items;
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
  async createTag(name: string): Promise<{ id: number }> {
    return jsonFetch<{ id: number }>('/api/tags.php', { method: 'POST', body: JSON.stringify({ name }) }, true);
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
  async attachTag(associationId: number, tagId: number): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>(
      '/api/tags.php',
      { method: 'POST', body: JSON.stringify({ action: 'attach', associationId, tagId }) },
      true,
    );
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
  async detachTag(associationId: number, tagId: number): Promise<{ ok: boolean }> {
    return jsonFetch<{ ok: boolean }>(
      '/api/tags.php',
      { method: 'POST', body: JSON.stringify({ action: 'detach', associationId, tagId }) },
      true,
    );
  },

  /**
   * Lists municipalities for filter dropdowns.
   *
   * Returns:
   *   Promise<Municipality[]>
   */
  async getMunicipalities(): Promise<Municipality[]> {
    const res = await jsonFetch<{ items: Municipality[] }>('/api/municipalities.php', { method: 'GET' });
    return res.items;
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
  async getNotes(associationId: number): Promise<Note[]> {
    const res = await jsonFetch<{ items: Note[] }>(
      `/api/association_notes.php?association_id=${encodeURIComponent(String(associationId))}`,
      { method: 'GET' },
    );
    return res.items;
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
  async addNote(associationId: number, content: string): Promise<{ id: number }> {
    return jsonFetch<{ id: number }>(
      '/api/association_notes.php',
      { method: 'POST', body: JSON.stringify({ association_id: associationId, content }) },
      true,
    );
  },
};
