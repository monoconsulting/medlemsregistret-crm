# Backup Checklist (Manual Step)

Physical database and web backups must be performed outside the repository:

1. Export the full MySQL/MariaDB database (schema + data) from Loopia and the local environment. Store the dumps under `backups/db-<date>.sql`.
2. Download the previously deployed site files from Loopia and archive them under `backups/web-live-<date>/`.

These artefacts are not committed for security reasons but the directories above are reserved for storing them locally before deployment.
