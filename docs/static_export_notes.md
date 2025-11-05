# Static Export Notes

- The Next.js app in `crm-app/` must run entirely on the client after authentication. All data fetching goes through `lib/api.ts`, which uses `fetch` to the same-origin PHP API.
- Run `npm install` and `npm run build && npm run export` inside `crm-app/` to produce the static output under `crm-app/out/`.
- Deploy the contents of `crm-app/out/` along with the `/api/` directory to both local staging and Loopia—no conditional code paths are needed.
- Because the app performs client-side data loading, ensure any protected routes check for authentication state in the browser and redirect to `/login` when the PHP API returns `401`.
- When testing locally, serve the exported build through a simple static server (e.g., `npx serve crm-app/out`) so that cookies behave the same as on Loopia.
- Loopia docroot expectations:
  - `public_html/` (or chosen webroot) contains the files produced in `crm-app/out/` (**not** the folder itself).
  - `public_html/api/` hosts the PHP endpoints copied from the repository `api/` folder, preserving `.htaccess`.
  - Copy `crm-app/public/.htaccess` into the webroot to enforce static caching headers, and keep `api/.htaccess` alongside the PHP scripts for no-store semantics.
  - File permissions: directories `0755`, PHP files `0644`; no writable paths required for the app.

## Local Verification Layout

To mirror the production structure on your workstation:

```bash
cd /mnt/e/projects/CRM
cd crm-app && npm run export && cd ..
rm -rf temp/local_webroot
mkdir -p temp/local_webroot
cp -R crm-app/out/. temp/local_webroot/
cp -R api temp/local_webroot/api
php -S 127.0.0.1:8080 -t temp/local_webroot
```

If `8080` is occupied, replace it with any free port (e.g., `8060`) and use that port in all verification steps.

The static site and PHP API will now be available at `http://127.0.0.1:8080`,
allowing verification steps (HAR capture, smoke tests) to run against the same-origin layout before deploying to Loopia.
