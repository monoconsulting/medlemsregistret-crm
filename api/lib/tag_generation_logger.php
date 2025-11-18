<?php
/**
 * Tag Generation Logging Helper
 * Provides comprehensive logging for tag generation process
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

class TagGenerationLogger {
    private $pdo;
    private $jobId;

    // Log levels
    const LEVEL_DEBUG = 'DEBUG';
    const LEVEL_INFO = 'INFO';
    const LEVEL_WARNING = 'WARNING';
    const LEVEL_ERROR = 'ERROR';

    // Log categories
    const CAT_INIT = 'INIT';
    const CAT_DB_READ = 'DB_READ';
    const CAT_TAXONOMY_LOAD = 'TAXONOMY_LOAD';
    const CAT_ASSOCIATION_PROCESS = 'ASSOCIATION_PROCESS';
    const CAT_TAG_MATCH = 'TAG_MATCH';
    const CAT_TAG_CREATE = 'TAG_CREATE';
    const CAT_TAG_LINK = 'TAG_LINK';
    const CAT_PROGRESS_UPDATE = 'PROGRESS_UPDATE';
    const CAT_REPORT_WRITE = 'REPORT_WRITE';
    const CAT_ERROR = 'ERROR';
    const CAT_COMPLETE = 'COMPLETE';
    const CAT_DB_CONNECT = 'DB_CONNECT';
    const CAT_CONFIG = 'CONFIG';
    const CAT_SCRIPT_START = 'SCRIPT_START';
    const CAT_BATCH_PROCESS = 'BATCH_PROCESS';

    public function __construct(?PDO $pdo, string $jobId) {
        $this->pdo = $pdo;
        $this->jobId = $jobId;
    }

    /**
     * Log a debug message
     */
    public function debug(string $category, string $message, ?array $data = null): void {
        $this->log(self::LEVEL_DEBUG, $category, $message, $data);
    }

    /**
     * Log an info message
     */
    public function info(string $category, string $message, ?array $data = null): void {
        $this->log(self::LEVEL_INFO, $category, $message, $data);
    }

    /**
     * Log a warning message
     */
    public function warning(string $category, string $message, ?array $data = null): void {
        $this->log(self::LEVEL_WARNING, $category, $message, $data);
    }

    /**
     * Log an error message
     */
    public function error(string $category, string $message, ?array $data = null): void {
        $this->log(self::LEVEL_ERROR, $category, $message, $data);
    }

    /**
     * Main logging function
     */
    private function log(string $level, string $category, string $message, ?array $data = null): void {
        // Always write to PHP error log for debugging
        $logMsg = sprintf('[TAG-GEN][%s][%s][%s] %s', $this->jobId, $level, $category, $message);
        if ($data !== null) {
            $logMsg .= ' | Data: ' . json_encode($data);
        }
        error_log($logMsg);

        // If no PDO connection, we can't write to DB (might be during initialization)
        if ($this->pdo === null) {
            return;
        }

        try {
            $id = $this->generateCuid();
            $timestamp = date('Y-m-d H:i:s');
            $jsonData = $data !== null ? json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;

            $stmt = $this->pdo->prepare("
                INSERT INTO TagGenerationLog (id, jobId, timestamp, level, category, message, data)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $id,
                $this->jobId,
                $timestamp,
                $level,
                $category,
                $message,
                $jsonData
            ]);
        } catch (Exception $e) {
            // If logging fails, log to error log only
            error_log("Failed to write to TagGenerationLog: " . $e->getMessage());
        }
    }

    /**
     * Generate a CUID-like ID (simplified version)
     */
    private function generateCuid(): string {
        // Using a simplified approach - base62 encoding of timestamp + random
        $timestamp = (int)(microtime(true) * 1000);
        $random = bin2hex(random_bytes(8));
        return 'cl' . base_convert((string)$timestamp, 10, 36) . $random;
    }

    /**
     * Log database connection attempt
     */
    public function logDbConnection(bool $success, array $config): void {
        $safeConfig = $config;
        if (isset($safeConfig['password'])) {
            $safeConfig['password'] = '***';
        }

        if ($success) {
            $this->info(self::CAT_DB_CONNECT, 'Database connection established', $safeConfig);
        } else {
            $this->error(self::CAT_DB_CONNECT, 'Database connection failed', $safeConfig);
        }
    }

    /**
     * Log configuration loading
     */
    public function logConfig(string $source, array $config): void {
        $safeConfig = [];
        foreach ($config as $key => $value) {
            // Mask sensitive values
            if (stripos($key, 'pass') !== false || stripos($key, 'secret') !== false) {
                $safeConfig[$key] = '***';
            } else {
                $safeConfig[$key] = $value;
            }
        }

        $this->info(self::CAT_CONFIG, "Configuration loaded from $source", $safeConfig);
    }

    /**
     * Log taxonomy loading
     */
    public function logTaxonomyLoad(int $count, string $source): void {
        $this->info(self::CAT_TAXONOMY_LOAD, "Loaded $count taxonomy entries from $source", [
            'count' => $count,
            'source' => $source
        ]);
    }

    /**
     * Log association batch processing
     */
    public function logBatchStart(int $batchNumber, int $offset, int $limit): void {
        $this->info(self::CAT_BATCH_PROCESS, "Starting batch #$batchNumber (offset: $offset, limit: $limit)", [
            'batch' => $batchNumber,
            'offset' => $offset,
            'limit' => $limit
        ]);
    }

    /**
     * Log association processing
     */
    public function logAssociationProcess(string $assocId, string $assocName, array $fields): void {
        $this->debug(self::CAT_ASSOCIATION_PROCESS, "Processing association: $assocName", [
            'id' => $assocId,
            'name' => $assocName,
            'fields' => $fields
        ]);
    }

    /**
     * Log tag matching
     */
    public function logTagMatch(string $assocId, string $rawValue, ?string $canonical, bool $matched): void {
        if ($matched) {
            $this->debug(self::CAT_TAG_MATCH, "Tag matched: '$rawValue' -> '$canonical'", [
                'associationId' => $assocId,
                'rawValue' => $rawValue,
                'canonical' => $canonical
            ]);
        } else {
            $this->debug(self::CAT_TAG_MATCH, "No match for tag: '$rawValue'", [
                'associationId' => $assocId,
                'rawValue' => $rawValue
            ]);
        }
    }

    /**
     * Log tag creation
     */
    public function logTagCreate(string $tagName, string $tagId, bool $created): void {
        if ($created) {
            $this->info(self::CAT_TAG_CREATE, "Created new tag: $tagName", [
                'tagId' => $tagId,
                'tagName' => $tagName
            ]);
        } else {
            $this->debug(self::CAT_TAG_CREATE, "Tag already exists: $tagName", [
                'tagId' => $tagId,
                'tagName' => $tagName
            ]);
        }
    }

    /**
     * Log tag linking to association
     */
    public function logTagLink(string $assocId, string $tagId, string $tagName, bool $linked, ?string $reason = null): void {
        if ($linked) {
            $this->debug(self::CAT_TAG_LINK, "Linked tag '$tagName' to association", [
                'associationId' => $assocId,
                'tagId' => $tagId,
                'tagName' => $tagName
            ]);
        } else {
            $this->debug(self::CAT_TAG_LINK, "Skipped linking tag '$tagName' to association", [
                'associationId' => $assocId,
                'tagId' => $tagId,
                'tagName' => $tagName,
                'reason' => $reason ?? 'Already linked'
            ]);
        }
    }

    /**
     * Log progress update
     */
    public function logProgress(int $processed, int $total, array $stats): void {
        $percent = $total > 0 ? round(($processed / $total) * 100, 1) : 0;
        $this->info(self::CAT_PROGRESS_UPDATE, "Progress: $processed/$total ($percent%)", array_merge([
            'processed' => $processed,
            'total' => $total,
            'percent' => $percent
        ], $stats));
    }

    /**
     * Log report writing
     */
    public function logReportWrite(string $reportPath, int $rowCount): void {
        $this->info(self::CAT_REPORT_WRITE, "Report written to $reportPath", [
            'path' => $reportPath,
            'rows' => $rowCount
        ]);
    }

    /**
     * Log completion
     */
    public function logComplete(array $summary): void {
        $this->info(self::CAT_COMPLETE, 'Tag generation completed', $summary);
    }
}
