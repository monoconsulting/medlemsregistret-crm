# Static Export Notes

- The Next.js app must render purely on the client after login; pages under `/app/(dashboard)` should avoid server-only data fetching.
- `next export` produces a static bundle served from Loopia alongside `/api/*.php`.
- Dynamic data is fetched at runtime via `lib/api.ts` using same-origin requests, so exported HTML includes loading states until data arrives.
- Ensure any environment-dependent URLs are resolved via relative paths (e.g., `/api/...`). Do not embed absolute origins in the build.
- Authentication state is derived from the PHP session cookie; during static export no session is available, so components should handle unauthenticated state gracefully and redirect to `/login` on client mount if `api.me()` (future) returns 401.
- When adjusting routing, keep query parameter parsing client-side; avoid `generateStaticParams` for pages that depend on database content.
