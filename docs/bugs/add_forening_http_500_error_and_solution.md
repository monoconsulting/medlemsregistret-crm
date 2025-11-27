

## 1. What actually fails

### Call path

1. Your agents / UI call:

   ```http
   POST https://crm.medlemsregistret.se/api/associations.php
   ```

2. In `api/associations.php` that hits:

   ```php
   $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
   
   switch ($method) {
     case 'GET':
       handle_list_associations();
       break;
     case 'POST':
       $body = read_json();
       $action = $body['action'] ?? 'create';
       if ($action === 'export') {
         handle_export_associations();
       } else {
         handle_create_association();   // <-- this is called for your “Lägg till förening”
       }
       break;
   ...
   ```

3. `handle_create_association()` starts around line 198:

   ```php
   function handle_create_association(): void {
     require_auth();
     require_csrf();
     rate_limit('associations-create', 40, 60);
   
     $body = read_json();
   
     $name = normalize_nullable_string($body['name'] ?? null, 255);
     if ($name === '') {
       json_out(400, ['error' => 'Name is required']);
     }
   
     $municipalityId = normalize_nullable_string($body['municipality_id'] ?? null, 36);
     $municipality   = normalize_nullable_string($body['municipality'] ?? null, 255);
     $orgNumber      = normalize_nullable_string($body['org_number'] ?? null, 60);
     $status         = normalize_association_status($body['status'] ?? null);
     $pipeline       = normalize_pipeline($body['pipeline'] ?? null);
     $isMember       = normalize_bool($body['is_member'] ?? false);
     $memberSince    = normalize_date_string($body['member_since'] ?? null);
     $email          = normalize_email($body['email'] ?? null);
     $phone          = normalize_nullable_string($body['phone'] ?? null, 64);
     $street         = normalize_nullable_string($body['street_address'] ?? null, 255);
     $postal         = normalize_nullable_string($body['postal_code'] ?? null, 32);
     $city           = normalize_nullable_string($body['city'] ?? null, 255);
     $detailUrl      = normalize_nullable_string($body['detail_url'] ?? null, 1024);
     $website        = normalize_url($body['website'] ?? null);
     $descriptionFree = normalize_nullable_string($body['description_free_text'] ?? null, 5000);
     $description     = encode_json_field($body['description'] ?? null);
     $types           = encode_json_array($body['types'] ?? []);
     $activities      = encode_json_array($body['activities'] ?? []);
     $categories      = encode_json_array($body['categories'] ?? []);
     $extras          = encode_json_field($body['extras'] ?? null);
   
     $assignedToId = normalize_nullable_string($body['assigned_to_id'] ?? null, 36);
     if ($assignedToId !== '' && !user_exists($assignedToId)) {
       json_out(400, ['error' => 'Assigned user not found']);
     }
   
     $id = generate_id();
   ```

4. Then it builds the INSERT into `Association`:

   ```php
   $sql = "INSERT INTO Association (
             id,
             sourceSystem,
             municipalityId,
             municipality,
             scrapeRunId,
             scrapedAt,
             detailUrl,
             name,
             orgNumber,
             types,
             activities,
             categories,
             homepageUrl,
             streetAddress,
             postalCode,
             city,
             email,
             phone,
             description,
             descriptionFreeText,
             crmStatus,
             isMember,
             memberSince,
             pipeline,
             assignedToId,
             extras,
             createdAt,
             updatedAt
           ) VALUES (
             ?, 'MANUAL', ?, ?, NULL, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
           )";
   ```

5. And **this is the crucial line that blows up** (line numbers match your error):

   ```php
   $stmt = db()->prepare($sql);
   $stmt->bind_param(
     'ssssssssssssssssssissss',
     $id,
     $municipalityId !== '' ? $municipalityId : null,   // <-- argument #3 in the error
     $municipality !== '' ? $municipality : null,
     $detailUrl !== '' ? $detailUrl : null,
     $name,
     $orgNumber !== '' ? $orgNumber : null,
     $types,
     $activities,
     $categories,
     $website !== '' ? $website : null,
     $street !== '' ? $street : null,
     $postal !== '' ? $postal : null,
     $city !== '' ? $city : null,
     $email !== '' ? $email : null,
     $phone !== '' ? $phone : null,
     $description,
     $descriptionFree !== '' ? $descriptionFree : null,
     $status !== '' ? $status : 'UNCONTACTED',
     $isMember,
     $memberSince,
     $pipeline,
     $assignedToId !== '' ? $assignedToId : null,
     $extras
   );
   ```

Your PHP error log:

> ```
> mysqli_stmt::bind_param(): Argument #3 could not be passed by reference in ... associations.php on line 275
> ```

matches exactly the third parameter to `bind_param` here:

- Arg #1: type string `'ssssssssssssssssssissss'`
- Arg #2: `$id`
- **Arg #3: `$municipalityId !== '' ? $municipalityId : null`**

------

## 2. Root cause (why PHP 500 happens)

`mysqli_stmt::bind_param()` **requires all value arguments to be variables passed by reference**.

You are passing several **expressions** (ternary operators) directly:

```php
$municipalityId !== '' ? $municipalityId : null,
$municipality  !== '' ? $municipality  : null,
$detailUrl     !== '' ? $detailUrl     : null,
...
$status !== '' ? $status : 'UNCONTACTED',
$assignedToId !== '' ? $assignedToId : null,
```

Those are not variables; they are computed expressions. PHP tries to pass them **by reference** and fails, resulting in:

> ```
> Argument #3 could not be passed by reference
> ```

So the immediate cause of the HTTP 500 is:

- **Bug in the POST handler** `handle_create_association()` – invalid use of `bind_param` with ternary expressions, instead of using variables.

Everything before that (auth, CSRF, rate limit, JSON parsing, normalization) succeeds; the crash happens *right when binding SQL parameters*.

------

## 3. Related code & database observations

### 3.1 Other uses of bind_param in this file

In `api/associations.php` there are only two direct `bind_param` calls:

1. The **broken** one in `handle_create_association()` (above).

2. A simple one later:

   ```php
   $stmt = db()->prepare('SELECT 1 FROM Association WHERE id = ? LIMIT 1');
   $stmt->bind_param('s', $id);
   ```

The second one is fine (plain variable).

For the rest of the file, all dynamic binding is routed through a helper:

```php
function bind_all(mysqli_stmt $stmt, string $types, array $params): void {
  if ($types === '' || empty($params)) {
    return;
  }
  $refs = [];
  foreach ($params as $i => $value) {
    $refs[$i] = &$params[$i];      // pass *references*
  }
  array_unshift($refs, $types);
  call_user_func_array([$stmt, 'bind_param'], $refs);
}
```

You already solved the reference problem in list/update flows by using `bind_all(...)`, but the create path still uses a raw `bind_param(...)` with expressions.

### 3.2 Frontend side: what is being sent

In `crm-app/lib/api.ts` the create call is:

```ts
async createAssociation(data: Partial<Association>): Promise<{ id: AssocID }> {
  return jsonFetch('/api/associations.php', { method: 'POST', body: data }, true);
}
```

`jsonFetch` wraps this, adds CSRF header and JSON-encodes the body. So the request payload matches what the PHP handler expects:

- `name`, `municipality_id`, `municipality`, `org_number`, `status`, `pipeline`, `is_member`, `member_since`, `email`, `phone`, `street_address`, `postal_code`, `city`, `detail_url`, `website`, `description_free_text`, `description`, `types`, `activities`, `categories`, `extras`, `assigned_to_id`.

The agent UI and the manual “Lägg till förening” UI both end up posting to the same endpoint, so both will hit this bug.

### 3.3 Database schema & potential future issue

In `crm-app/migration.sql` you have:

```sql
-- AlterTable
ALTER TABLE `Association` DROP COLUMN `descriptionFreeText`;
```

While `api/associations.php` still:

- **Selects** `a.descriptionFreeText`:

  ```sql
  CONVERT(a.descriptionFreeText USING utf8mb4) AS description_free_text,
  ```

- **Inserts** into `descriptionFreeText`:

  ```sql
  descriptionFreeText,
  ...
  ?,  -- $descriptionFree
  ```

- **Updates** `descriptionFreeText` in the update handler.

So:

- If the Loopia DB **still has** `descriptionFreeText`, everything is consistent.
- If you (or the Node backend) have applied that Prisma migration and actually dropped the column in the shared DB, then **after fixing the current bug**, the INSERT/SELECT/UPDATE will start failing with SQL errors like *“Unknown column 'descriptionFreeText'”*.

That is not causing the current 500 (we never reach the `execute()` call), but it’s an important thing to verify when you deploy a fix.

------

## 4. Fix plan (concrete steps)

### Step 1 – Fix parameter binding in `handle_create_association()`

Change the `bind_param` call so that **every bound value is a proper variable**, then either:

- Use precomputed variables, or
- Use your existing `bind_all()` helper.

**Recommended (cleaner & consistent): use `bind_all()`**

1. Right before binding, construct a `$params` array with the final values:

   ```php
   $params = [
     $id,
     $municipalityId !== '' ? $municipalityId : null,
     $municipality  !== '' ? $municipality  : null,
     $detailUrl     !== '' ? $detailUrl     : null,
     $name,
     $orgNumber     !== '' ? $orgNumber     : null,
     $types,
     $activities,
     $categories,
     $website       !== '' ? $website       : null,
     $street        !== '' ? $street        : null,
     $postal        !== '' ? $postal        : null,
     $city          !== '' ? $city          : null,
     $email         !== '' ? $email         : null,
     $phone         !== '' ? $phone         : null,
     $description,
     $descriptionFree !== '' ? $descriptionFree : null,
     $status        !== '' ? $status : 'UNCONTACTED',
     $isMember,
     $memberSince,
     $pipeline,
     $assignedToId  !== '' ? $assignedToId : null,
     $extras,
   ];
   
   $types = 'ssssssssssssssssssissss'; // unchanged
   ```

2. Replace the raw `bind_param` call with:

   ```php
   $stmt = db()->prepare($sql);
   bind_all($stmt, $types, $params);
   $stmt->execute();
   ```

Because `bind_all` converts `$params` to references internally, this removes the “Argument #3 could not be passed by reference” issue entirely and makes the create-path consistent with list/update.

**Alternative (if you want to keep raw bind_param):**

Define *variables* for each expression:

```php
$municipalityIdParam = $municipalityId !== '' ? $municipalityId : null;
$municipalityParam   = $municipality !== '' ? $municipality : null;
$detailUrlParam      = $detailUrl !== '' ? $detailUrl : null;
// ... etc for all ternary cases ...

$stmt = db()->prepare($sql);
$stmt->bind_param(
  'ssssssssssssssssssissss',
  $id,
  $municipalityIdParam,
  $municipalityParam,
  $detailUrlParam,
  $name,
  $orgNumberParam,
  $types,
  $activities,
  $categories,
  $websiteParam,
  $streetParam,
  $postalParam,
  $cityParam,
  $emailParam,
  $phoneParam,
  $description,
  $descriptionFreeParam,
  $statusParam,
  $isMember,
  $memberSince,
  $pipeline,
  $assignedToIdParam,
  $extras
);
```

The important part is: **no ternary expressions directly inside `bind_param`**.

### Step 2 – Verify placeholders and type string

Before/after the change, confirm:

- Number of `?` in the `VALUES(...)` chunk = 23.
- Length of the type string `'ssssssssssssssssssissss'` = 23.
- Order of parameters in the array/argument list matches the column order in the SQL.

You already have this consistent; don’t change the order unless you change the SQL.

### Step 3 – Check the `Association` table schema

In Adminer/phpMyAdmin against the actual Loopia DB:

1. Inspect `Association`:
   - Confirm the columns:
     - `id`
     - `sourceSystem`
     - `municipalityId`
     - `municipality`
     - `scrapeRunId`
     - `scrapedAt`
     - `detailUrl`
     - `name`
     - `orgNumber`
     - `types`
     - `activities`
     - `categories`
     - `homepageUrl`
     - `streetAddress`
     - `postalCode`
     - `city`
     - `email`
     - `phone`
     - `description`
     - `descriptionFreeText`
     - `crmStatus`
     - `isMember`
     - `memberSince`
     - `pipeline`
     - `assignedToId`
     - `extras`
     - `createdAt`
     - `updatedAt`
2. If `descriptionFreeText` **exists**:
   - No change needed; keep your PHP code as-is regarding that column.
3. If `descriptionFreeText` has been **dropped** (Prisma migration applied):
   - You will need a separate clean-up step later to:
     - Remove that column from all SELECT/INSERT/UPDATE statements in `api/associations.php`.
     - Adjust the parameter list and type string accordingly.
   - That is a *second* task, independent of the immediate 500-fix. For now, log it as a known future adjustment.

### Step 4 – Retest creation from both UI and agents

After deploying the fixed `api/associations.php`:

1. **Manual test via the dashboard:**

   - Log in to the CRM.
   - Go to **Föreningar → Lägg till förening**.
   - Fill in the mandatory fields (name, municipality, etc.).
   - Save.
   - Expected:
     - No HTTP 500 – you should get a 200 JSON response with `{ id: "<generated-id>" }`.
     - The new association appears in the list and any “web portal” view fed by the same catalogue.

2. **Agent test:**

   - Trigger the same “create association” use-case via your AI agent (same POST).
   - Confirm it also completes with 200 and that the inserted entry is identical in structure to the one created via the UI.

3. **DB sanity check:**

   - In Adminer/phpMyAdmin, run:

     ```sql
     SELECT *
     FROM Association
     WHERE id = '<returned-id>';
     ```

   - Confirm:

     - `sourceSystem = 'MANUAL'`
     - `name`, `municipalityId` / `municipality`, `detailUrl`, `homepageUrl`, etc. are populated as expected.
     - `createdAt` and `updatedAt` are set to `NOW()`.

### Step 5 – Scan for similar future traps

You have already centralized dynamic binding through `bind_all()`. To keep things robust:

- Enforce an internal rule for this codebase:
   **“For any variable-length parameter list, always use `bind_all()` instead of calling `bind_param` manually.”**
- For simple, fixed signatures it’s ok to keep raw `bind_param`, but **never** with expressions – always variables.

You’ve already done that for list and update; once the create path is refactored to `bind_all`, the whole `associations.php` file will follow the same pattern.

------

## 5. Short version

- The HTTP 500 when creating a new förening comes from `handle_create_association()` in `api/associations.php`.
- The cause is using ternary expressions directly in `mysqli_stmt::bind_param()`, which must receive variables by reference.
- Fix: build a `$params` array with the final values and call `bind_all($stmt, $types, $params)` (or introduce variables for each ternary and pass those to `bind_param`).
- Then verify the `Association` table still has `descriptionFreeText`; if not, plan a separate clean-up to remove that column from all SQL in this file.
- After the fix, both the UI (“Lägg till förening”) and your agents should be able to create associations without 500 errors, and the “web portal” will be populated as intended.