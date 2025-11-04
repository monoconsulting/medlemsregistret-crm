# Static Export Notes

The new Next.js frontend is built as a static export (`next export`). Key behaviours:

- All pages render client-side after login. The exported build contains pre-rendered HTML shells and hydrated React bundles.
- Authentication relies on the PHP session cookie. Refreshing an authenticated page triggers the React app which immediately fetches data; if the session expired, the user is redirected to `/login`.
- The build command `npm run export` generates the `out/` folder. Deploy the contents of `out/` alongside the `/api/` directory on Loopia.
- Deep links (e.g. `/associations`) are supported because `next export` emits static HTML for each route.
- Ensure `/api/` is deployed in the same directory as the exported assets so relative `fetch('/api/...')` calls resolve.
