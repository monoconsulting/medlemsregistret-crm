# Implementation Plan for Standalone Membership CRM Frontend on Loopia

**Overview:** We will redeploy the membership CRM as a static Next.js frontend with a minimal PHP + MySQL backend on Loopia. All existing UI/UX and functionality (search, filters, CRUD operations, notes, tags, pagination, login) will remain unchanged. The Node.js/Prisma/tRPC backend is removed and replaced by PHP endpoints on the same origin (Loopia host), using the existing MySQL schema. The scraping module and other non-UI features will be preserved in the codebase but **not deployed** on Loopia (they will continue to run separately, updating the database). The system will be single-user: authentication is handled via a PHP session (one set of credentials in the database). We will implement CSRF protection using a token stored server-side (in session) and provided to the client via cookie, which the frontend includes in API requests. No Docker, Node server, or external services will be required at runtime – the Loopia environment will serve static files (HTML/CSS/JS) and PHP scripts connected to MySQL.

## 1. Pre-Deployment Preparation

Before making any changes, perform the following preparatory steps:

- [x] **Backup the Database:** Export a backup of the current MySQL/MariaDB database (e.g. using Loopia’s control panel or a mysqldump script). This ensures data safety before migrations.
- [x] **Backup the Current Frontend:** If a previous version of the site is running on Loopia (or if any static content is present), back up those files. This could involve downloading the existing site files via FTP or the hosting control panel.
- [x] **Review Schema Definitions:** Document the current Prisma schema or database schema. Compare it to the actual tables in Loopia’s database to ensure all needed tables and columns exist and are up-to-date. We will reuse the existing schema and data, creating no new tables – just adding some indexes for performance and possibly one admin user record if not present.

## 2. Required PHP API Endpoints (Same-Origin)

Create a minimal set of PHP endpoints under a directory (e.g. `/api/`) on the Loopia host. These will handle all data operations that the frontend needs, replacing the former tRPC calls. All endpoints will accept/return JSON and operate on the same domain as the static frontend (avoiding CORS issues). Include a small PHP bootstrap in each or a common include (`bootstrap.php`) to handle database connection, JSON output headers, and shared security logic (session start, auth check, CSRF check). Below is a breakdown of the required endpoints and their functions:

- [ ] **`/api/login.php`** – **Method:** POST. Accepts user credentials (email and password). Checks these against the `users` table (e.g. using a bcrypt password hash comparison). If valid, it starts a PHP session, stores the user’s ID in `$_SESSION['uid']`, and returns a success response. It should also set a session cookie (PHP’s default `PHPSESSID` or a custom `sid`) to maintain the login state. Only one user account is expected (single-user system), so no elaborate user management is needed.
- [ ] **`/api/logout.php`** – **Method:** POST. Invalidates the current session (e.g. `session_destroy()`), clearing the login state. Returns a simple JSON message on success. This ensures the single user can log out securely.
- [ ] **`/api/csrf.php`** – **Method:** GET. Provides a CSRF token. This script generates a secure random token (if one is not already in the session), stores it server-side (e.g. in `$_SESSION['csrf_token']`), and sends it to the client. The token is sent in two ways: (a) as a cookie named `csrf` (so that client-side code can read it), and (b) in the response body (e.g. JSON containing the token) for convenience. The client will call this endpoint on app load or before making any state-changing requests to ensure it has a CSRF token cookie.
- [ ] **`/api/associations.php`** – **Methods:**
  - **GET:** Returns a list of associations (membership records) with support for search and filters. The endpoint reads query parameters for filtering/sorting, for example: `q` (text search query), `municipality` (municipality ID or name filter), `type` (filter by association type), `status` (filter by status), `tags[]` (multiple tag filters), as well as `page` and `pageSize` for pagination, and `sort` for sort order. It constructs a SQL `SELECT` with `WHERE` clauses based on these parameters. Only records not soft-deleted are included (i.e. `deleted_at IS NULL`). The result is returned as JSON containing an array of association objects and pagination info (e.g. `items`, `total` count, current `page` and `pageSize`). This allows the frontend to display a paginated list and know how many total results exist.
  - **POST:** Creates a new association record. Expects JSON body with the necessary fields (name, contact info, etc). Only accessible to the logged-in user; verify the session and CSRF token on request. On success, insert the new record into the `associations` table and return the created object or a success status.
  - **PUT/PATCH:** Updates an existing association’s data. The association ID can be specified in the query (e.g. `?id=123`) or in the JSON body. Only specific fields should be updatable (as allowed by the UI). Validate and sanitize inputs server-side. On success, perform an `UPDATE` on that record and return the updated object or status. Requires valid session and CSRF token.
  - **DELETE:** Performs a *soft delete* on an association. Rather than removing the record, set its `deleted_at` timestamp (and possibly a `deleted_by` if needed) to mark it as deleted. Subsequent GET queries should exclude records with `deleted_at` set. This endpoint requires auth + CSRF and returns a success response. (If needed, a separate endpoint or parameter could undo a soft deletion, but that’s beyond scope unless UI provides it.)
- [ ] **`/api/association_notes.php`** – **Methods:**
  - **GET:** Retrieve all notes for a given association. Expects an `associationId` query parameter. Returns JSON list of note entries (each including note content, author, timestamp, etc.) associated with that association, sorted by date.
  - **POST:** Add a new note to an association. Expects JSON body (or form data) with `associationId` and the note content (and possibly an author name if applicable). Inserts a new record into the `notes` table linking it to the association. Returns the created note (with its new ID and timestamp) or success status. Requires an active session and CSRF.
- [ ] **`/api/tags.php`** – **Methods:**
  - **GET:** List all available tags. Returns a JSON array of tags (each tag might have an `id` and a name). This is used to populate tag filters or tag assignment UI.
  - **POST:** Create a new tag. Accepts a tag name (e.g. in request body) and inserts into the `tags` table, returning the new tag’s ID and name. This allows the user to add new tags via the UI. Requires auth + CSRF.
  - *Tag Associations:* (If needed) The endpoint `tags.php` can also handle adding or removing tags on an association. For example, a sub-action or separate endpoint could manage the many-to-many relationship. One simple approach is to handle tag-assignment via the `associations.php` update (including a list of tag IDs to set). Alternatively, we can create dedicated endpoints such as `/api/association_tags.php` to **attach** or **detach** a tag to/from a given association. These would operate on the join table. For brevity, you may implement attaching/detaching in the main association update or via a POST/DELETE in `tags.php` (with associationId and tagId parameters). In either case, ensure that adding a tag creates a record in the join table, and removing deletes that record.
- [ ] **`/api/municipalities.php`** – **Method: GET.** Returns a list of all municipalities (id and name, possibly code) from the `municipalities` table. The frontend uses this to populate a municipality filter dropdown. This endpoint does not require auth if the login screen needs municipality data, but typically filtering is done after login on the main interface, so it can be restricted as well. (If used on a public-facing part, it could be left accessible without auth, as it’s non-sensitive data.)

**Result:** Each of these PHP scripts will output JSON with `Content-Type: application/json; charset=utf-8`. It’s recommended to send appropriate HTTP status codes (200 for success, 401 for unauthorized, 403 for CSRF failure, etc.) and error messages in JSON if something goes wrong (e.g. `{"error": "Invalid credentials"}` for a login failure). We will use a common include file to handle starting the session and connecting to the database, as well as utility functions like `require_auth()` (which checks `$_SESSION['uid']`) and a CSRF validation function that compares the incoming header token with the session token.

## 3. Files to create in `/api/`:

** Based on the above, create the following PHP files on the Loopia server:**

- [ ] - `bootstrap.php` – Contains common initialization code (start session, connect to DB via mysqli or PDO using credentials from a config, set JSON headers, and define helper functions like `require_auth()` and `verify_csrf()` to be used by other endpoints). This can be included at the top of each endpoint file.
  - `login.php`, `logout.php`, `csrf.php` – Authentication and CSRF endpoints as described.
  - `associations.php`, `association_notes.php`, `tags.php`, `municipalities.php` – Data endpoints covering CRUD for associations, notes, tags, and fetching filters.
- [ ] Additionally, add an `.htaccess` file in the `/api` directory (since Loopia is likely running Apache for PHP) to ensure proper behavior. In `.htaccess`, you can:

- [ ] Deny directory listings (`Options -Indexes`) so the PHP files aren’t browsable.
- [ ] Force JSON content type for responses (e.g., `AddType application/json .php` or ensure scripts set the header).
- [ ] Perhaps rewrite requests without `.php` extensions if you prefer cleaner URLs (optional; e.g. allow `/api/associations` to map to `associations.php`). This is not strictly necessary, but can be done for neatness.

Finally, create a configuration file or use environment constants for DB connection info. For example, have a `config.php` or use environment variables (if Loopia supports) that `bootstrap.php` includes to get MySQL host, database name, user, password. Do **not** commit sensitive credentials to source control; you can keep this config file out of the repo or use placeholders and fill actual values on the server.

## 4. Database Schema and Indexes

### Information and reference

We will use the existing MySQL database on Loopia. The schema (originally defined via Prisma) includes tables for associations, tags, notes, municipalities, and users. No new tables are needed, but we will add some indexes to improve query performance on the shared hosting environment. Below is a summary of the key tables and their relevant columns (for reference):

- **associations** – Stores each member association record. Key fields: `id` (primary key), `name`, `municipality_id` (foreign key to municipalities), `type` (category/type of association), `status` (e.g. active/inactive), contact info (`email`, `phone`, `address`, `website`), `description` (text description), timestamps (`created_at`, `updated_at`), and `deleted_at` for soft delete markers.
- **municipalities** – List of municipalities (regions or cities). Fields: `id`, `name`, `code`, etc. Associations table links to this by `municipality_id`.
- **tags** – List of tag labels that can be assigned to associations. Fields: `id`, `name`, etc.
- **association_tags** – Join table linking associations and tags (many-to-many relationship). Fields: `association_id`, `tag_id`. Each unique combination represents one tag attached to one association (enforce uniqueness either via a composite primary key or unique index on (association_id, tag_id)).
- **notes** – Table for notes attached to associations. Fields: `id`, `association_id` (foreign key to an association), `content` (text of the note), `author` (could be the user or system, depending on usage), `created_at` timestamp.
- **users** – Table for user accounts (in this case just one user/admin). Fields: `id`, `email` (unique), `password_hash` (store a bcrypt hash of the password), `created_at`. Only one row is needed here for the single user login. Ensure the password is hashed securely (e.g. use PHP `password_hash` and `password_verify` in `login.php`).

**Indexes for Performance:** To ensure the app runs smoothly on Loopia’s shared environment, add the following indexes (if not already present):

- **Text Search Index:** If the search feature (`q` parameter) looks up associations by name or description, consider a fulltext index on those columns. For example, add a FULLTEXT index on `associations(name, description)` to speed up text queries. This allows the `q` filter to use MySQL fulltext search (with `MATCH ... AGAINST`) if supported by Loopia’s MySQL version. If FULLTEXT is not available or not desired, ensure at least an index on `name` for prefix searches (though note that a normal index won’t help `LIKE '%term%'` queries, but will help `LIKE 'term%'` or exact matches).
- **Filter Field Indexes:** Add simple indexes on columns used for filtering: `associations.municipality_id`, `associations.type`, and `associations.status`. These columns often have repeat values and are used in WHERE clauses when the user filters by municipality, type, or status, so indexing them improves query speed.
- **Tag Join Indexes:** Add indexes on the join table for efficient tag filtering. Specifically, index `association_tags(association_id)` and `association_tags(tag_id)`. This allows quick retrieval of all tags for a given association and all associations having a given tag. When the user filters by tag, the query will involve `association_tags` to find matching associations, and this index will make that lookup faster.
- **Primary & Foreign Keys:** Ensure primary keys are set on ID columns and foreign key relationships (e.g. association_id in notes and in association_tags, municipality_id in associations) either have indexes or are defined as foreign keys (which usually creates an index). For example, an index on `notes(association_id)` will speed up fetching notes by association. These might already exist if the schema was properly set up with Prisma, but it’s good to double-check.

All index additions can be done via Loopia’s phpMyAdmin or Adminer interface. After adding indexes, test typical queries (search with filters) to ensure they execute quickly (ideally under a few hundred milliseconds) even as the data grows.

## Frontend Modifications: Replacing tRPC with Fetch API

The Next.js frontend (located in the `crm-app/` directory) will be mostly preserved in terms of UI and components, but we need to change how it interacts with the backend. All tRPC calls and any direct Node/Express API calls must be removed or replaced, since we won’t have a Node server in production. We will implement a lightweight client API wrapper using `fetch()` to call the new PHP endpoints.

Key tasks for frontend adaptation:

1. **Implement a Client API Module:** Create a module (for example, `crm-app/lib/api.ts`) that exports functions corresponding to each needed backend operation. This will mirror the tRPC procedures but using HTTP requests. For instance:

   - `login(email, password)`: calls `POST /api/login.php` with credentials, handles setting the session cookie.
   - `logout()`: calls `POST /api/logout.php` to destroy session.
   - `getAssociations(params)`: calls `GET /api/associations.php` with query params for filters, returns the JSON list of associations.
   - `createAssociation(data)`: calls `POST /api/associations.php` with JSON body to add a new record.
   - `updateAssociation(id, data)`: calls `PUT /api/associations.php?id=ID` (or sends ID in body) with fields to update.
   - `deleteAssociation(id)`: calls `DELETE /api/associations.php?id=ID` to soft-delete the record.
   - `getAssociationNotes(associationId)`: calls `GET /api/association_notes.php?associationId=ID` to fetch notes.
   - `addNote(associationId, content)`: calls `POST /api/association_notes.php` with JSON body (associationId and content) to add a note.
   - `getTags()`: calls `GET /api/tags.php` to fetch all tags.
   - `createTag(name)`: calls `POST /api/tags.php` to create a new tag. (If tag assignment is done via separate endpoints, you might also have `addTagToAssociation(assocId, tagId)` etc.).
   - `getMunicipalities()`: calls `GET /api/municipalities.php` to fetch the list of municipalities.

   Each function should use the browser Fetch API to make the request. Ensure to include credentials so that the session cookie is sent (e.g. `fetch(url, { method: 'GET', credentials: 'include' })` and similarly for POST) since our PHP session relies on cookies. Also, for **write operations** (POST, PUT, DELETE), include the CSRF token header. For example:

   ```
   const csrfToken = getCsrfFromCookie(); // a helper to read the 'csrf' cookie
   await fetch('/api/associations.php?id=' + id, {
       method: 'DELETE',
       credentials: 'include',
       headers: { 'X-CSRF-Token': csrfToken }
   });
   ```

   We can reuse the existing CSRF helper from the project (if one exists, e.g. `lib/csrf.ts`) to read the token cookie and set the header on each request. Also, implement logic to automatically call the CSRF endpoint if no token is present – for instance, a function `ensureCsrf()` that calls GET `/api/csrf.php` to set the cookie before the first modifying request. This prevents a 403 on the first POST in a new session.

2. **Replace tRPC calls in Frontend Components:** Search through the Next.js app for any usage of the tRPC client or direct API calls. This might be in React components, pages, or hooks that load data or submit forms. Replace those with calls to the new `lib/api.ts` methods. For example, if there was a tRPC mutation like `trpc.association.update({...})`, you would instead call `api.updateAssociation(id, data)`. Ensure that all UI data flows (loading lists, submitting forms, etc.) now go through the fetch-based API module. Components should await these calls and handle the returned promises (which will contain JSON data). Use the same loading states and error handling UI as before, but now errors might come as Fetch errors or JSON error payloads – handle accordingly (maybe show a notification or console error on failure).

3. **Maintain UI/UX Exactly:** Do not change the visual design or remove features in the UI. All search forms, filters, buttons, and dialogs remain, but now they obtain data via the new API. For instance, if previously the tags filter dropdown was populated via tRPC, now call `api.getTags()` on component mount to fill it. The notes panel for an association should call `api.getAssociationNotes(associationId)` to load notes, etc. The user should not see any difference in how the app behaves, aside from possibly slight differences in response times. **Keep the styling and layout the same** – only the data layer changes under the hood.

4. **Remove Node-Specific Code:** Eliminate references to the old backend. Uninstall or remove any tRPC client setup, and any imports from `@/server/*` paths or Node APIs in the frontend code. For example, if there was a directory for API routes or tRPC routers in the Next.js app, those can be deleted or excluded from the build. Also remove any context providers or hooks that were tied to tRPC. The goal is that the frontend becomes a pure static app that does not expect a Next.js/Node server at runtime.

5. **Implement a Single-User Login UI:** Since this CRM is for a single user, it likely has a simple login page. Ensure that the login form on the frontend calls `api.login(email, password)` (from the new module) on submit. On success (HTTP 200), you can redirect the user to the main app page or update state to indicate the user is logged in. You might store a flag in local state or context that the user is authenticated (or simply rely on the presence of the session cookie, though in a purely static app you might not have a global auth provider – you can just attempt to fetch data and if you get a 401, redirect to login). For logout, call `api.logout()` and on success, clear any auth state and redirect to the login page. The UI elements for login/logout should remain as they were, just wired to the new calls.

6. **Preserve Routing and Navigation:** If the Next.js app uses client-side routing (via Next Link or useRouter) for pages like association details or others, this remains unaffected by our changes. If any pages were server-side rendered or used getServerSideProps/getStaticProps that pulled data from the Node backend, we need to refactor those to either static or client-side fetch. Ideally, convert any such data fetching to happen client-side via the API calls. If using Next’s App Router with React server components, you might adapt those to fetch data on the client (since we cannot call PHP from the server side at build time easily). Another approach is to use Next.js static generation for pages that can be prerendered (if any), but most likely this app’s pages (after login) are dynamic lists and forms which will load data on the client. Ensure that performing a full page refresh on any route still works – since we will deploy as static files, deep links like `/associations/123` should correspond to an HTML file or a fallback. You may need to configure Next.js to export those pages as static. If the app is a single-page app (with client-side routing only), then just ensure the entry point exists.

By the end of this step, the Next.js app should be able to run entirely in a static environment, using `fetch` to communicate with PHP endpoints for all data needs. Test it locally (you can simulate by building and serving the static files and having a local PHP server or mocking with a simple JSON server) to verify that all interactions work with the new API module.

## Building and Deploying the Static Frontend

Once the frontend code is updated and working with the new API layer, we need to produce a static build and deploy it to Loopia:

1. **Build the Next.js app for static export:** Ideally, configure the Next.js project to output a static site. If the project is using the Next.js **Pages Router**, you can likely run `next build && next export`, which will generate an `out/` directory containing static HTML, CSS, JS, and assets. If using the **App Router** (as noted in the current setup), ensure all pages can be rendered as static or fallback to client rendering. You may need to adjust some Next.js config to allow export. Run the export and verify that the `out` folder has an `index.html` and other page files corresponding to your routes (or a fallback `404.html` as needed). If static export is not straightforward (due to dynamic routes), another option is to do a normal `next build` and then copy the `.next/static` assets and use a custom server to serve the pages. However, since we cannot run a Node server on Loopia, **Next export is the preferred approach** to get a purely static site. In summary, try to refactor any remaining server-only features to enable a full static export.
2. **Upload static files to Loopia:** Once the static build is ready, deploy it to the hosting. This typically involves uploading the files via FTP or Loopia’s file manager to the web root (e.g. the `public_html` directory for your domain). The `out` directory’s contents should be placed in the appropriate directory so that your site’s root URL serves `index.html`. Maintain the subdirectory structure exactly as generated (Next might create subfolders for each page path). For example, if Next generated `out/associations/[id].html` or a folder, ensure it’s placed such that accessing `/associations/123` on the website loads the correct file. If Next’s export created clean URLs (folders with index.html inside), you might need to ensure the server knows to serve `index.html` by default in those folders (Apache usually does this by default). If needed, you can add an `.htaccess` rule in the root to redirect requests for clean URLs to their `index.html` (but this is typically not needed if the files are in matching folders).
3. **Deploy the PHP API files:** In the same deployment, upload the `api` folder containing the PHP scripts to the server (ensuring it is in the correct location, likely under the same root so that `https://yourdomain/api/login.php` is accessible). Double-check file permissions (they should be readable/executable by the web server) and that the PHP files have the correct `.php` extension. Also upload the `bootstrap.php` and any config file. The `api` folder can reside alongside the static files but it’s good to keep it separate from the Next.js static output (which might have its own folder structure). For example, you could have `public_html/index.html` (and other Next static pages) and `public_html/api/associations.php`, etc., in the same root directory. This way, the paths `/api/...` map to the PHP scripts. Make sure `api` folder name doesn’t clash with any Next.js page route (if the Next app had an `/api` route or page, rename one or the other; by default Next’s `/api` is for API routes in Node, which we’re not using in static export).
4. **Set up environment configuration on server:** Ensure the PHP scripts know how to connect to the database. If using a `config.php` or `.env` file, edit it on the server to include the Loopia database hostname (often something like `mysqlNN.loopia.se`), the database name, and credentials. Confirm that the database is accessible from the PHP (Loopia usually hosts the DB locally so it should work). Start the PHP session at the beginning of each relevant script (`session_start()`) and configure PHP session settings if necessary (by default, it will use cookies). For added security, you might configure the session cookie to be HTTPOnly and Secure if using HTTPS. However, note that the CSRF token cookie **cannot** be HTTPOnly since the client script needs to read it; it should be Secure (if site is HTTPS) but accessible to JavaScript.
5. **CSRF Cookie Path:** When setting the CSRF cookie in `csrf.php`, ensure the cookie’s path is set to the root (`Path=/`) so that it’s sent on all API requests. Also, consider using the `SameSite` attribute (e.g. `SameSite=Strict` or `Lax`) on the cookie to prevent it from being sent in cross-site contexts; since our app is same-origin, this is just an extra safety. In PHP `setcookie`, you can specify these options.
6. **Testing on Loopia:** After uploading, test the site online. Access the page, go through the login flow, and perform some operations to ensure everything is connecting properly. You may need to enable error logging or check PHP error logs on Loopia if something is not working (e.g. blank page or 500 errors on the API). Common issues might be missing PHP extensions (ensure Loopia’s PHP has MySQLi/PDO), permission issues, or missing include paths. Adjust as needed. Once it’s working, the deployment is nearly complete.

## Session & CSRF Security Configuration in PHP

Security is crucial, especially since we’re moving to a PHP environment. We will use standard PHP session management for authentication and a token-based CSRF protection to secure form submissions:

- **Single-User Authentication:** The `users` table will contain a single user account (admin). Create this user in the database if not already there – set the email and a **bcrypt-hashed** password. (In PHP, you can use `password_hash('plainTextPassword', PASSWORD_BCRYPT)` to generate a hash and store it.) The login form sends credentials to `/api/login.php`. In `login.php`, fetch the user by email, verify the password with `password_verify`. If correct, initialize the session (`session_start()` if not already) and store the user’s ID in session (`$_SESSION['uid'] = $userId`). Optionally, regenerate the session ID to prevent fixation. The PHP session system will set a cookie (e.g. `PHPSESSID`) in the response; ensure this cookie is not overwritten and is marked `HttpOnly`. (The session cookie need not be accessible by JS, as we only need it to be sent automatically by the browser.) We do not need OAuth or multi-user logic – this is a simple direct login.
- **Protecting API Endpoints (Require Auth):** For any endpoint beyond login and csrf (i.e. data endpoints), enforce that the user is logged in. In `bootstrap.php`, after `session_start()`, create a helper `require_auth()` that checks `if (!isset($_SESSION['uid']))` – if not set, return an HTTP 401 Unauthorized response (and perhaps exit). Call `require_auth()` at the top of endpoints like associations.php, notes.php, etc., before processing the request. This ensures only the authenticated user can access or modify data.
- **CSRF Token Implementation:** To prevent cross-site request forgery, we use a token that the client must send back with write operations. When the user is logged in (session active), they must first call `/api/csrf.php` (the frontend can do this automatically). In `csrf.php`, generate a random token (e.g. PHP’s `bin2hex(random_bytes(32))` for a 64-character hex string). Store this in the session (e.g. `$_SESSION['csrf_token'] = $token`). Send the token to the client in a cookie named `csrf` (using `setcookie('csrf', $token, [...])`) and also return it in the response JSON for convenience. The cookie allows client-side code to easily retrieve the token value. For subsequent requests that modify data (POST/PUT/DELETE), the frontend will include an HTTP header `X-CSRF-Token` with the token value. On the PHP side, implement a check (in `bootstrap.php` or in each relevant file) that for state-changing requests, `$_SERVER['REQUEST_METHOD']` is POST/PUT/DELETE then: read the header `$_SERVER['HTTP_X_CSRF_TOKEN']` (or from php://input if not in $_SERVER), compare it with the session’s stored token. If missing or not matching, respond with 403 Forbidden. Only proceed if token matches. This ensures that even if the session cookie is stolen or sent by a malicious site, without the CSRF token an attacker cannot perform actions. *(Since our app is single-origin and not sending cookies cross-site, the risk is lower, but this is a good safeguard.)*
- **Same-Origin Benefits:** All requests are same-origin (the static files and PHP are served from the same domain). This means we do not need to handle CORS headers. The browser will automatically send the session cookie with our AJAX calls (because we use `credentials: 'include'` in fetch). There is no exposure of the API to other domains, which simplifies security. Just ensure the domain of the cookies (session and csrf) is correct (usually the current domain by default).
- **Input Validation & SQL Safety:** Since we are writing new PHP endpoints, ensure to use parameterized queries or proper escaping for any SQL statements to prevent SQL injection. For example, if using PDO, use prepared statements with bound parameters; if using mysqli, use prepared statements or at least `mysqli_real_escape_string` for any dynamic parts. Validate and sanitize inputs (e.g. numeric IDs, allowed strings for sort order, etc.). Also enforce reasonable limits on queries – for instance, the `pageSize` parameter in list endpoints should have a max cap (perhaps 100) to prevent extremely large responses or heavy load on the DB. These considerations protect the app on the shared host.
- **Session Timeout:** Optionally, configure a session timeout or inactivity timeout (by PHP settings or manual checks) to auto-logout the user after a period, since it’s single-user it might be fine to stay logged in indefinitely, but for safety you might log out after e.g. 30 minutes of inactivity (this can be done by tracking a timestamp in session and checking on each request).

By following these authentication and CSRF practices, the PHP backend will be secure and only accessible to the authorized user. The client-side code simply needs to handle obtaining and sending the CSRF token, which we have included in our `lib/api.ts` design.

## Packaging and Uploading the Frontend to Loopia

To reiterate, after adjusting the frontend code and implementing the PHP backend, the deployment to Loopia will involve copying the static build and PHP files onto the host:

- **Static Assets:** Use the Next.js static export output (HTML, JS, CSS, images). Place them in the web directory (e.g. `public_html/`) on Loopia. Maintain any subdirectories as is. If the app uses client-side routing (without reloading pages), ensure that direct navigation to any route goes to a valid file. If needed, you can add a fallback rule in an `.htaccess` (for example, to redirect 404s to `index.html` for a single-page app). But since Next export generates actual pages, this might not be necessary except for dynamic routes. Verify by trying to access a deep link on the deployed site.
- **API Scripts:** Upload the `api` directory with all PHP scripts into the same `public_html` (or appropriate) folder. Double-check that you can reach, say, `/api/municipalities.php` via the browser (it may just return JSON or an auth error if not logged in, which is fine).
- **File Exclusions:** Do not upload source code files that are not needed for runtime. This includes any server-side Node code (the entire previous `backend` folder with Express/tRPC/Prisma should not be on Loopia), as well as the scraping scripts or any dev tools. Only deploy the build output and the new PHP files. Keep your repository organized such that the deployable files are separated (for example, Next’s `out` directory and an `api` folder). You may create a deployment script to automate uploading only the necessary files.
- **Testing in Production:** Once deployed, test the system live on Loopia. Go through a full usage scenario:
  - Load the login page, attempt login with correct and incorrect credentials to ensure it behaves properly.
  - Once logged in, verify that the list of associations loads (the GET request to `/api/associations.php` should return data).
  - Test filtering by various criteria (this triggers queries with URL params).
  - Create a new association through the UI form – ensure it appears in the list.
  - Edit an existing association’s field – check the change persists after reload.
  - Delete (soft delete) an association – it should disappear from the main list (and possibly appear only in some "deleted" view if that exists, otherwise just gone).
  - Add a note to an association, then retrieve the notes to see it listed.
  - Create a new tag and assign it to an association (if UI supports this) – then filter by that tag to see the association.
  - Log out, and ensure you can’t access data without logging back in.
     Any issues discovered should be fixed locally and re-deployed. Use browser dev tools to watch network requests; ensure that no requests are failing or taking excessively long, and that no unexpected CORS or CSRF errors occur (the console should be free of such warnings).

## Verification Checklist (Post-Deployment)

Use the following checklist to verify that the deployed application is fully functional and secure:

- **Authentication:** The **login** process works correctly. A session cookie is set upon login, and the user can access protected routes. Logging out destroys the session. Try accessing an API endpoint (e.g. associations) without login to confirm it’s blocked (should return 401).
- **CSRF Protection:** Calling `GET /api/csrf.php` sets the `csrf` cookie. Subsequent **POST/PUT/DELETE** requests include the `X-CSRF-Token` header and are accepted only if the token is correct. Test by omitting or altering the token to ensure the server responds with 403 Forbidden. Ensure the browser console shows no CSRF-related errors.
- **Association Listing & Filtering:** The main list of associations loads and can be filtered by text search, municipality, type, status, and tags as before. Each filter query returns the expected subset of data. The UI updates accordingly and no errors occur.
- **CRUD Operations:** Create, update, and soft-delete operations on associations all function. After each action, the changes are reflected in the UI and in the database. A deleted association should not appear in the list (confirm that `deleted_at` was set in DB). Updates should persist (refresh page to ensure the updated data is fetched).
- **Tags Management:** Tags are handled properly – listing all tags works, new tags can be created, and tags can be attached to or removed from an association (depending on UI capabilities). If you remove a tag from an association, ensure the association_tags entry is deleted and it no longer shows in that association’s tag list. Filtering by tag yields correct results.
- **Notes:** Adding a note to an association via the UI should call the API and on success, the note appears in the notes list for that association. Refreshing or reloading the notes panel should fetch the same note (persisted in DB). Also ensure notes are only seen for the correct association and not globally.
- **Pagination & Sorting:** If the association list is long, verify that pagination controls work – e.g. moving to page 2 calls the API with `page=2` and results are shown. The API’s JSON for list endpoints should include `total`, `page`, and `pageSize` fields so the frontend knows how many pages there are. Sorting controls (if any, e.g. sort by name or last updated) should request the API with the appropriate `sort` parameter and the results should come back in that order.
- **No Console Errors:** Check the browser’s developer console for errors or warnings. There should be no CORS errors (since all calls are same-origin) and no CSRF token missing errors if implemented correctly. All API calls should return HTTP 200 (or 304) on success. Any 4xx/5xx errors need investigation.
- **Performance:** The app should feel responsive. List queries with typical filters should return quickly (under a second). Using the browser network timeline or a tool, ensure that the API queries are efficient (thanks to the indexes). If any query is slow, consider further indexing or query optimization.

By going through this checklist, we can be confident the deployment meets the requirements.

## Legacy Code and Assets to Exclude

Several parts of the original project are not needed in the Loopia deployment. We should remove or disable them to simplify the system and avoid unnecessary files on the server:

- **Node.js Backend (Express/tRPC/Prisma):** All code related to the Node/Express server and Prisma ORM should be removed from the deployment. This includes server-side business logic, API route definitions, middlewares (like the `csurf` package if used), tRPC router definitions, and any Node-specific configuration. These are now replaced by the PHP API and thus not used. You may keep this code in a repository branch for reference, but it should not be active or included in the production build.
- **Scraping Scripts and Import Tools:** The project’s scraping functionality (and any data import scripts or Playwright tests) should remain **untouched in the codebase** (for preservation) but **not deployed on Loopia**. Those typically run in a Docker or local environment to gather data and write to the database. We will continue to run them separately as needed to update the DB. Do not integrate scraping into the PHP app or front end. Just ensure the database schema stays compatible so that scraped data can be read by the frontend. Keep the scraping directory in source control for development use, but exclude it from the files uploaded to Loopia (to avoid any security risk or confusion, since it won’t run there).
- **Docker and DevOps Configs:** Remove Docker-related files (Dockerfile, docker-compose.yml) and any deployment scripts that assume a Node environment. On Loopia we run directly on their LAMP stack, so Docker is irrelevant. You might keep these files in the repository for local development convenience, but they are not used in production.
- **Automated Tests and AI Widgets:** If the project had Playwright end-to-end tests or any AI integration (the prompt mentioned “AI-widgets”), these should be stripped out for production. For example, if there was an AI assistant button in the UI, hide or remove it (or at least disable it via a feature flag defaulting to off). Any code that calls third-party AI APIs or requires additional keys should not run on Loopia. This reduces external dependencies and potential security issues. The core CRM functionality does not rely on these, so the UI/UX impact is minimal (the UI can simply not show those features if they exist).
- **Multi-user or Role-based Code:** If the original app had support for multiple users, roles/permissions, or emailing, those can be omitted or simplified. We only need a single admin user and no role distinctions. Remove any UI elements or backend code related to user management beyond the one login. Similarly, background job schedulers or email notifications (if any) should be turned off or removed to avoid broken calls in the PHP environment (unless they are essential, which the prompt indicates they are not).
- **Environment Keys:** Ensure that no secrets (API keys, etc.) are left in the frontend bundle. Since we removed external service integrations, there should be none. But double-check that the static build doesn’t contain any references to development URLs or keys. The only configuration needed at runtime is the PHP DB credentials, which we handle server-side.

In summary, **deploy only the essential code**: the static frontend and the minimal PHP API. Everything else (scraping, tests, old backend, dev scripts) remains in source control for reference but is not part of the deployed application. This reduces the attack surface and resource usage on Loopia. The UI will remain the same for end-users, just powered by a simpler backend.

------

By following this implementation plan step-by-step, an AI agent or developer can systematically replace the Next.js/Node backend with a PHP solution suitable for Loopia, without altering the user experience. The plan ensures all user-facing functionality is preserved, the system is secure (sessions & CSRF protected), and performance is optimized within the limits of a shared PHP/MySQL hosting environment. All scraping and background processes are kept separate and unmodified, focusing this deployment solely on the membership management interface.

Uppgift 2: 





Gå igenom bifogad plan och jämför mot kodbasen 

2.1. Är planen heltäckande och full funktionalitet kvarstår på i både lokal och remote frontend?

2.2.  Är full funktionalitet bibehållen i backend?

2.3. Har vi en heltäckande distributionsmodell av frontend som innebär att vi endast exekverar ett skript för att uppdatera frontend remote?

Planen som är bifogad här behöver göras om till en strukturerad tekniskt och mycket detaljerad införande plan - HELT anpassad för AI-agenter.  Jag vill också att den kod som skapats tidigare inkluderas i denna plan.

Planen ska skapas med faser, sprints och tasks. En task ska inte konsumera mer än en agents kontextfönster. 

Det ska finnas extremt tydliga instruktioner till agenten. 

Filer ska inte raderas utan ersättas och gamla filen döps om alternativ läggs i en egen filkatalog. 

Skriv en systemprompt som fungerar för arbetet.

Vi har haft en diskussion tidigare om implementation av ett standalone frontend som jobbar mot databasen enbart och inte har några kopplingar mot någon backend.

Systemet ska kunna köras från webhotellet på loopia. Där finns koppling mot loopias databas och detta fungerar utan kopplingar mot annat än AI-api.

Systemet med frontend ska kunna köras från backend på docker.  Där finns utökad funktionalitet - som inte är speglad i frontend - avseende playwright, importskript och annat men detta är ej inkluderat i frontend - dvs webbgränssnitt utan det är exakt samma gränssnitt både remote och lokalt.

Frontend till loopia ska kunna skapas och publiceras från docker. 

1: Förklara för mig hur den nya frontenden är tänkt att fungera - kommer vi ersätta logiken i både dockerinstansen och loopia? Om inte - vad finns det för fördelar att använda två varav den ena är avsevärt mer komplex?