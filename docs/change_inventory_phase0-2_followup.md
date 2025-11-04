# Change Inventory – Post Phase 0–2 Adjustments

## Updated Files
- `crm-app/components/association-form.tsx` – Added client-side sanitization and validation for email and website fields before submit to catch malformed input early.
- `api/bootstrap.php` – Introduced centralized error logging helper and emit diagnostics for configuration, connection, and JSON parsing failures.

## Notes
- Validation keeps the existing UI intact while improving data hygiene.
- Logging uses PHP's native `error_log`, ensuring compatibility with shared hosting environments like Loopia.
