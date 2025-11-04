# Static Export Notes

- The Next.js app in `crm-app/` must run entirely on the client after authentication. All data fetching goes through `lib/api.ts`, which uses `fetch` to the same-origin PHP API.
- Run `npm install` and `npm run build && npm run export` inside `crm-app/` to produce the static output under `crm-app/out/`.
- Deploy the contents of `crm-app/out/` along with the `/api/` directory to both local staging and Loopia—no conditional code paths are needed.
- Because the app performs client-side data loading, ensure any protected routes check for authentication state in the browser and redirect to `/login` when the PHP API returns `401`.
- When testing locally, serve the exported build through a simple static server (e.g., `npx serve crm-app/out`) so that cookies behave the same as on Loopia.
