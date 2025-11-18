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

export interface ManagedUser {
  id: string;
  name: string | null;
  email: string | null;
  role: AuthRole;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Pagination {
  page?: number;
  pageSize?: number;
  sort?:
    | 'name_asc'
    | 'name_desc'
    | 'updated_desc'
    | 'updated_asc'
    | 'created_desc'
    | 'created_asc'
    | 'crm_status_asc'
    | 'crm_status_desc'
    | 'pipeline_asc'
    | 'pipeline_desc'
    | 'municipality_asc'
    | 'municipality_desc'
    | 'email_asc'
    | 'email_desc'
    | 'type_asc'
    | 'type_desc'
    | 'recent_activity_desc'
    | 'recent_activity_asc';
}

export interface AssocFilters extends Pagination {
  q?: string;
  municipality?: string;
  municipalityIds?: string[];
  type?: string;
  types?: string[];
  status?: string;
  crmStatuses?: string[];
  pipeline?: string;
  pipelines?: string[];
  activities?: string[];
  tags?: string[]; // tag names or IDs (backend accepts both, see PHP)
  hasEmail?: boolean;
  hasPhone?: boolean;
  isMember?: boolean;
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  lastActivityDays?: number;
}

export interface Association {
  id: AssocID;
  name: string;
  municipality_id: string | null;
  municipality_name?: string | null;
  municipality?: string | null;
  source_system?: string | null;
  org_number?: string | null;
  type: string | null;
  types?: string[];
  status: string | null;
  crm_status?: string | null;
  pipeline?: string | null;
  activities?: string[];
  categories?: string[];
  is_member?: boolean;
  member_since?: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  street_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  detail_url?: string | null;
  website: string | null;
  description: string | Record<string, unknown> | null;
  description_free_text?: string | null;
  extras?: Record<string, unknown> | null;
  primary_contact?: {
    id: string;
    name: string | null;
    role: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    is_primary: boolean;
  } | null;
  contacts_count?: number;
  notes_count?: number;
  recent_activity?: {
    id: string;
    type: string;
    description: string | null;
    created_at: string;
    metadata?: unknown;
  } | null;
  assigned_to?: {
    id: string | null;
    name: string | null;
    email: string | null;
  } | null;
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

export interface Group {
  id: string;
  name: string;
  description: string | null;
  searchQuery: any | null;
  autoUpdate: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
  _count?: {
    memberships: number;
  };
  createdBy?: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export interface GroupMembership {
  id: string;
  groupId: string;
  associationId: string;
  addedAt: string;
  association?: {
    id: string;
    name: string;
    municipality?: string | null;
    crmStatus?: string | null;
  };
}

export interface GroupDetail extends Group {
  memberships: GroupMembership[];
}

export interface Contact {
  id: string;
  association_id: string;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  linkedin_url?: string | null;
  facebook_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssociationActivity {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
}

export interface AssociationGroupMembership {
  id: string;
  membership_id: string;
  name: string | null;
}

export interface AssociationDetail extends Association {
  contacts: Contact[];
  notes: Note[];
  activity_log: AssociationActivity[];
  group_memberships: AssociationGroupMembership[];
}

export interface Municipality {
  id: string;
  name: string;
  code: string | null;
  countyCode: string | null;
  county: string | null;
  region: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  registerUrl: string | null;
  registerStatus: string | null;
  homepage: string | null;
  platform: string | null;
  associationCount?: number;
  activeAssociations?: number;
}

export type DashboardRangeKey = "this_month" | "last_30_days" | "this_quarter" | "this_year";

export type DashboardChangeDirection = "up" | "down" | "flat";

export interface DashboardMetricChange {
  value: number;
  context: string;
  direction: DashboardChangeDirection;
  previous: number;
  current: number;
}

export interface DashboardMetric {
  value: number;
  change: DashboardMetricChange;
}

export interface MunicipalityCoverageMetric {
  value: number;
  total: number;
  completionRate: number;
  complete: boolean;
  label: string;
}

export interface DashboardSummaryMetrics {
  activeAssociations: DashboardMetric;
  municipalityCoverage: MunicipalityCoverageMetric;
  scannedAssociations: DashboardMetric;
  contactProfiles: DashboardMetric;
  contactedAssociations: DashboardMetric;
  contactsThisWeek: DashboardMetric;
  contactsThisMonth: DashboardMetric;
  newMembersThisMonth: DashboardMetric;
}

export interface DashboardTrendPoint {
  period: string;
  weekKey: string;
  start: string;
  end: string;
  members: number;
  contacts: number;
}

export interface DashboardPieSlice {
  name: string;
  value: number;
  color: string;
}

export interface DashboardMemberEntry {
  id: string;
  name: string;
  municipality: string | null;
  tag: string | null;
  crmStatus: string | null;
  memberSince: string | null;
  contacted: boolean;
  updatedAt: string | null;
}

export interface DashboardOverviewResponse {
  range: {
    key: DashboardRangeKey;
    label: string;
    start: string;
    end: string;
  };
  summary: DashboardSummaryMetrics;
  charts: {
    newMembersTrend: DashboardTrendPoint[];
    contactsVsMembers: DashboardPieSlice[];
  };
  recentMembers: DashboardMemberEntry[];
  lastUpdated: string | null;
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
      let msg = data?.error || data?.message || `HTTP ${res.status}`;
      if (res.status === 500 && url.startsWith('/api/contacts.php')) {
        msg = 'Fel vid kontaktlistning – troligen databas-schema. Kontakta admin.';
      }
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
   * Lists users for administration with optional query params.
   *
   * Args:
   *   params: { q?: string; includeDeleted?: boolean }
   *
   * Returns:
   *   Promise<ManagedUser[]>
   */
  async getUsers(params: { q?: string; includeDeleted?: boolean } = {}): Promise<ManagedUser[]> {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.includeDeleted) search.set('includeDeleted', '1');
    const query = search.toString();
    const url = query ? `/api/users.php?${query}` : '/api/users.php';
    const res = await jsonFetch(url, { method: 'GET' });
    const items = Array.isArray(res?.items) ? res.items : [];
    return items as ManagedUser[];
  },

  /**
   * Creates a new user.
   */
  async createUser(payload: { name?: string | null; email: string; role: AuthRole; password: string }): Promise<{ id: string }> {
    return jsonFetch('/api/users.php', { method: 'POST', body: payload }, true);
  },

  /**
   * Updates an existing user.
   */
  async updateUser(payload: { id: string; name?: string | null; email?: string; role?: AuthRole; password?: string }): Promise<{ success: boolean }> {
    return jsonFetch('/api/users.php', { method: 'PUT', body: payload }, true);
  },

  /**
   * Soft deletes a user.
   */
  async deleteUser(id: string): Promise<{ success: boolean }> {
    return jsonFetch('/api/users.php', { method: 'DELETE', body: { id } }, true);
  },

  /**
   * Restores a soft-deleted user.
   */
  async restoreUser(id: string): Promise<{ success: boolean }> {
    return jsonFetch('/api/users.php', { method: 'POST', body: { action: 'restore', id } }, true);
  },

  /**
   * Fetches dashboard overview metrics, charts, and recent member entries.
   *
   * Args:
   *   range: Optional range filter aligning with dashboard dropdown selections.
   *
   * Returns:
   *   Promise<DashboardOverviewResponse>
   */
  async getDashboardOverview(range?: DashboardRangeKey): Promise<DashboardOverviewResponse> {
    const params = new URLSearchParams();
    if (range) {
      params.set('range', range);
    }
    const url = params.size ? `/api/dashboard_overview.php?${params.toString()}` : '/api/dashboard_overview.php';
    const res = await jsonFetch(url, { method: 'GET' });
    if (res?.error) {
      throw new Error(String(res.error));
    }
    return res as DashboardOverviewResponse;
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
    if (filters.municipalityIds?.length) filters.municipalityIds.forEach(value => params.append('municipalityIds[]', value));
    if (filters.type) params.set('type', filters.type);
    if (filters.types?.length) filters.types.forEach(value => params.append('types[]', value));
    if (filters.status) params.set('status', filters.status);
    if (filters.crmStatuses?.length) filters.crmStatuses.forEach(value => params.append('crmStatuses[]', value));
    if (filters.pipeline) params.set('pipeline', filters.pipeline);
    if (filters.pipelines?.length) filters.pipelines.forEach(value => params.append('pipelines[]', value));
    if (filters.activities?.length) filters.activities.forEach(value => params.append('activities[]', value));
    if (filters.tags?.length) filters.tags.forEach(t => params.append('tags[]', t));
    if (filters.hasEmail !== undefined) params.set('hasEmail', filters.hasEmail ? '1' : '0');
    if (filters.hasPhone !== undefined) params.set('hasPhone', filters.hasPhone ? '1' : '0');
    if (filters.isMember !== undefined) params.set('isMember', filters.isMember ? '1' : '0');
    if (filters.assignedToId) params.set('assignedToId', filters.assignedToId);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (typeof filters.lastActivityDays === 'number') params.set('lastActivityDays', String(filters.lastActivityDays));
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.sort) params.set('sort', filters.sort);

    return jsonFetch(`/api/associations.php?${params.toString()}`, { method: 'GET' });
  },

  /**
   * Retrieves a detailed association payload with contacts, notes, activity.
   */
  async getAssociationDetail(id: AssocID): Promise<AssociationDetail> {
    const res = await jsonFetch(`/api/association_detail.php?id=${encodeURIComponent(String(id))}`, { method: 'GET' });
    return res.association as AssociationDetail;
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
   * Lists contacts for an association.
   */
  async getContacts(associationId: AssocID): Promise<Contact[]> {
    const res = await jsonFetch(`/api/contacts.php?association_id=${encodeURIComponent(String(associationId))}`, {
      method: 'GET',
    });
    return res.items as Contact[];
  },

  /**
   * Creates a contact for an association.
   */
  async createContact(payload: {
    associationId: AssocID;
    name?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    linkedin_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    instagram_url?: string | null;
    is_primary?: boolean;
  }): Promise<{ id: string }> {
    const body = {
      association_id: payload.associationId,
      name: payload.name ?? null,
      role: payload.role ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      mobile: payload.mobile ?? null,
      linkedin_url: payload.linkedin_url ?? null,
      facebook_url: payload.facebook_url ?? null,
      twitter_url: payload.twitter_url ?? null,
      instagram_url: payload.instagram_url ?? null,
      is_primary: payload.is_primary ?? false,
    };
    return jsonFetch('/api/contacts.php', { method: 'POST', body }, true);
  },

  /**
   * Updates an existing contact.
   */
  async updateContact(payload: {
    id: string;
    name?: string | null;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    linkedin_url?: string | null;
    facebook_url?: string | null;
    twitter_url?: string | null;
    instagram_url?: string | null;
    is_primary?: boolean;
  }): Promise<{ ok: boolean }> {
    const body = {
      id: payload.id,
      name: payload.name ?? null,
      role: payload.role ?? null,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      mobile: payload.mobile ?? null,
      linkedin_url: payload.linkedin_url ?? null,
      facebook_url: payload.facebook_url ?? null,
      twitter_url: payload.twitter_url ?? null,
      instagram_url: payload.instagram_url ?? null,
      is_primary: payload.is_primary ?? undefined,
    };
    return jsonFetch('/api/contacts.php', { method: 'PUT', body }, true);
  },

  /**
   * Deletes a contact by id.
   */
  async deleteContact(id: string): Promise<{ ok: boolean }> {
    return jsonFetch(`/api/contacts.php?id=${encodeURIComponent(String(id))}`, { method: 'DELETE' }, true);
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
    // API now returns array directly, not wrapped in { items: [] }
    return Array.isArray(res) ? res : (res?.items ?? []);
  },

  /**
   * Gets a single municipality by ID.
   *
   * Args:
   *   id: The municipality ID
   *
   * Returns:
   *   Promise<Municipality>: The municipality details
   */
  async getMunicipalityById(id: string): Promise<Municipality> {
    const res = await jsonFetch(`/api/municipalities.php?id=${encodeURIComponent(id)}`, { method: 'GET' });
    return res as Municipality;
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

  /**
   * Lists all groups with membership counts.
   *
   * Returns:
   *   Promise<Group[]>
   */
  async getGroups(): Promise<Group[]> {
    return jsonFetch('/api/groups.php', { method: 'GET' });
  },

  /**
   * Creates a new group.
   *
   * Args:
   *   name: string - group name
   *   description?: string - optional description
   *   autoUpdate?: boolean - whether to auto-update membership
   *
   * Returns:
   *   Promise<{id: string}>
   */
  async createGroup(payload: { name: string; description?: string; autoUpdate?: boolean }): Promise<{ id: string }> {
    return jsonFetch('/api/groups.php', { method: 'POST', body: payload }, true);
  },

  /**
   * Adds an association to a group.
   *
   * Args:
   *   groupId: string
   *   associationId: string
   *
   * Returns:
   *   Promise<{id: string}>
   */
  async addMemberToGroup(groupId: string, associationId: string): Promise<{ id: string }> {
    return jsonFetch('/api/groups.php', { method: 'POST', body: { action: 'addMember', groupId, associationId } }, true);
  },

  /**
   * Updates a group.
   *
   * Args:
   *   id: string
   *   payload: Partial group fields to update
   *
   * Returns:
   *   Promise<{success: boolean}>
   */
  async updateGroup(id: string, payload: Partial<Pick<Group, 'name' | 'description' | 'autoUpdate' | 'searchQuery'>>): Promise<{ success: boolean }> {
    return jsonFetch('/api/groups.php', { method: 'PUT', body: { id, ...payload } }, true);
  },

  /**
   * Deletes a group (soft delete).
   *
   * Args:
   *   id: string
   *
   * Returns:
   *   Promise<{success: boolean}>
   */
  async deleteGroup(id: string): Promise<{ success: boolean }> {
    return jsonFetch('/api/groups.php', { method: 'DELETE', body: { id } }, true);
  },

  /**
   * Gets a group by ID with memberships.
   *
   * Args:
   *   id: string - group ID
   *
   * Returns:
   *   Promise<GroupDetail>
   */
  async getGroupById(id: string): Promise<GroupDetail> {
    return jsonFetch(`/api/groups.php?id=${encodeURIComponent(id)}`, { method: 'GET' });
  },

  /**
   * Removes an association from a group.
   *
   * Args:
   *   groupId: string
   *   associationId: string
   *
   * Returns:
   *   Promise<{success: boolean}>
   */
  async removeMemberFromGroup(groupId: string, associationId: string): Promise<{ success: boolean }> {
    return jsonFetch('/api/groups.php', { method: 'POST', body: { action: 'removeMember', groupId, associationId } }, true);
  },

  /**
   * Exports group members to CSV file.
   *
   * Args:
   *   groupId: string
   *
   * Returns:
   *   Promise<{filename: string, mimeType: string, data: string}> - base64 encoded CSV data
   */
  async exportGroupMembers(groupId: string): Promise<{ filename: string; mimeType: string; data: string }> {
    return jsonFetch('/api/groups.php', { method: 'POST', body: { action: 'export', groupId } }, true);
  },

  /**
   * Triggers a tag generation job.
   *
   * Args:
   *   mode: "dry-run" | "execute" - execution mode
   *   source: "db:baseline" | "db:types" | "db:activities" | "db:categories" - data source
   *
   * Returns:
   *   Promise<{jobId: string, status: string, mode: string, source: string, message: string}>
   */
  async triggerTagGeneration(mode: 'dry-run' | 'execute', source: string): Promise<{
    jobId: string;
    status: string;
    mode: string;
    source: string;
    message: string;
  }> {
    return jsonFetch('/api/tag_generation.php', { method: 'POST', body: { mode, source } }, true);
  },

  /**
   * Gets the status of a tag generation job.
   *
   * Args:
   *   jobId: string - job identifier
   *
   * Returns:
   *   Promise<TagGenerationRun>
   */
  async getTagGenerationStatus(jobId: string): Promise<{
    id: string;
    status: string;
    mode: string;
    source: string;
    startedAt: string;
    completedAt: string | null;
    associationsProcessed: number;
    tagsCreated: number;
    linksCreated: number;
    linksSkipped: number;
    reportPath: string | null;
    reportUrl: string | null;
    summary: any | null;
    errors: string[];
    triggeredBy: string;
    triggeredByName: string;
  }> {
    return jsonFetch(`/api/tag_generation.php?jobId=${encodeURIComponent(jobId)}`, { method: 'GET' });
  },

  /**
   * Lists all tag generation runs with pagination.
   *
   * Args:
   *   limit?: number - max results (default 50, max 200)
   *   offset?: number - skip N results (default 0)
   *
   * Returns:
   *   Promise<{items: TagGenerationRun[], total: number, limit: number, offset: number}>
   */
  async listTagGenerationRuns(limit = 50, offset = 0): Promise<{
    items: Array<{
      id: string;
      status: string;
      mode: string;
      source: string;
      startedAt: string;
      completedAt: string | null;
      associationsProcessed: number;
      tagsCreated: number;
      linksCreated: number;
      linksSkipped: number;
      triggeredByName: string;
      reportUrl: string | null;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams({ action: 'reports', limit: String(limit), offset: String(offset) });
    return jsonFetch(`/api/tag_generation.php?${params.toString()}`, { method: 'GET' });
  },

  /**
   * Lists taxonomy aliases.
   *
   * Args:
   *   category?: string - optional category filter
   *
   * Returns:
   *   Promise<TagAlias[]>
   */
  async getTagAliases(category?: string): Promise<Array<{
    id: string;
    alias: string;
    canonical: string;
    category: string | null;
  }>> {
    const params = category ? new URLSearchParams({ category }) : new URLSearchParams();
    const url = params.toString() ? `/api/tag_taxonomy.php?${params.toString()}` : '/api/tag_taxonomy.php';
    const res = await jsonFetch(url, { method: 'GET' });
    return res.items || [];
  },

  /**
   * Creates a taxonomy alias mapping.
   *
   * Args:
   *   alias: string - variant spelling
   *   canonical: string - normalized form
   *   category?: string - optional category
   *
   * Returns:
   *   Promise<{id: string}>
   */
  async createTagAlias(alias: string, canonical: string, category?: string): Promise<{ id: string }> {
    return jsonFetch('/api/tag_taxonomy.php', { method: 'POST', body: { alias, canonical, category } }, true);
  },

  /**
   * Deletes a taxonomy alias.
   *
   * Args:
   *   id: string - alias ID
   *
   * Returns:
   *   Promise<{success: boolean}>
   */
  async deleteTagAlias(id: string): Promise<{ success: boolean }> {
    return jsonFetch(`/api/tag_taxonomy.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
  },
};
