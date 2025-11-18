# PHP Error Logging Configuration

This document describes the PHP error logging configuration for the CRM system, particularly for the Loopia production environment.

## Overview

PHP error logging is configured using `.user.ini` files, which are supported by Loopia's hosting environment. This allows us to customize PHP settings without access to the main `php.ini` file.

## Configuration Files

### `/api/.user.ini`
PHP configuration for the API endpoints (web requests).

**Key settings:**
- `log_errors = On` - Enable error logging
- `display_errors = Off` - Hide errors from browser (security)
- `error_reporting = E_ALL` - Log all error types
- `error_log = "logs/php_errors.log"` - Log file path

**Additional settings:**
- `post_max_size = 20M` - Maximum POST data size
- `upload_max_filesize = 20M` - Maximum upload size
- `max_execution_time = 300` - Script timeout (5 minutes)
- `memory_limit = 256M` - Memory limit
- Session configuration for security
- Timezone set to `Europe/Stockholm`

### `/.user.ini`
PHP configuration for command-line scripts (like `populate_tags_v2.php`).

**Key differences from API config:**
- `display_errors = On` - Show errors in CLI (helpful for debugging)
- `max_execution_time = 0` - No timeout for CLI scripts
- `memory_limit = 512M` - Higher memory limit for batch processing
- `error_log = "api/logs/php_errors.log"` - Logs to same file

## Log Files

### Location
All PHP errors are logged to: `/api/logs/php_errors.log`

### Security
- Web access to `/api/logs/` is denied via `.htaccess`
- Log files are excluded from git via `.gitignore`
- Only `.gitkeep`, `.htaccess`, and `README.md` are tracked in git

### Log Format
PHP logs include:
- Timestamp
- Error level (Notice, Warning, Error, Fatal, etc.)
- Error message
- File path and line number
- Stack trace (for exceptions)

## Deployment

The `.user.ini` files are automatically deployed to Loopia via:
```bash
scripts\deploy_loopia_frontend.bat
```

The deployment script syncs:
1. `/api/.user.ini` → FTP `/api/.user.ini`
2. `/.user.ini` → FTP `/.user.ini`
3. `/api/logs/.htaccess` → FTP `/api/logs/.htaccess`

## Monitoring Logs

### On Loopia (Production)
Access logs via FTP or SSH:
```bash
tail -f /path/to/webroot/api/logs/php_errors.log
```

Or download via FTP client to review locally.

### Locally
During development, check:
```bash
type api\logs\php_errors.log
```

## Log Rotation

**Important:** Loopia does not automatically rotate logs. To prevent disk space issues:

1. **Manual rotation** (if needed):
   ```bash
   # Via FTP/SSH
   mv php_errors.log php_errors.log.2024-11-11
   touch php_errors.log
   ```

2. **Automated rotation** (recommended for production):
   - Set up a cron job or scheduled task
   - Archive logs older than 30 days
   - Keep last 6 months of archived logs
   - Delete very old archives

## Troubleshooting

### Logs not being created
1. Check file permissions on `/api/logs/` directory (must be writable by PHP)
2. Verify `.user.ini` is present and correct
3. Check PHP version supports `.user.ini` (PHP 5.3+)
4. Check `php.ini` setting `user_ini.filename` is set to `.user.ini`

### Errors not appearing in log
1. Check `error_reporting` level is appropriate
2. Verify `log_errors = On` in `.user.ini`
3. Check file path in `error_log` setting
4. Ensure PHP process has write permission

### Log file too large
1. Implement log rotation (see above)
2. Consider reducing `error_reporting` level if too verbose
3. Fix recurring errors to reduce log volume

## Best Practices

1. **Production**: Always use `display_errors = Off` to prevent leaking sensitive info
2. **Development**: Use `display_errors = On` for easier debugging
3. **Log rotation**: Implement automated rotation to prevent disk space issues
4. **Monitoring**: Regularly review logs for recurring errors
5. **Security**: Never commit actual log files to git
6. **Cleanup**: Fix errors promptly rather than letting logs accumulate

## Related Files

- `/api/.user.ini` - API PHP configuration
- `/.user.ini` - CLI script PHP configuration
- `/api/logs/.htaccess` - Log directory security
- `/api/logs/README.md` - Log directory documentation
- `/.gitignore` - Excludes `*.log` files from git
