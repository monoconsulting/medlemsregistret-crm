<?php
/**
 * Sample configuration loader for the PHP API.
 *
 * Copy this file to `config.php` and adjust the defaults if you cannot rely
 * on environment variables. In production we expect DB credentials to be
 * supplied via `getenv()` so no secrets live in the repository.
 */

return [
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'crm',
    'db_user' => getenv('DB_USER') ?: 'crm_user',
    'db_pass' => getenv('DB_PASS') ?: '',
];
