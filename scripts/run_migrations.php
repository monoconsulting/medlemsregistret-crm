<?php
require_once __DIR__ . '/../api/bootstrap.php';

$migrations = [
    __DIR__ . '/../database/migrations/0001_crm_pipeline_metadata.sql',
    __DIR__ . '/../database/migrations/0002_crm_pipeline_seed_metadata.sql',
    __DIR__ . '/../database/migrations/0003_crm_pipeline_enum_update.sql',
];

echo "Starting migrations...\n";

$db = db();

foreach ($migrations as $file) {
    echo "Processing " . basename($file) . "...\n";
    $sql = file_get_contents($file);
    if (!$sql) {
        echo "Error: Could not read $file\n";
        exit(1);
    }

    // Split by semicolon, but be careful with triggers/procedures if any (none in these files)
    // Simple split should work for these specific files
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    foreach ($statements as $stmt) {
        if ($stmt === '') continue;
        
        try {
            if (!$db->query($stmt)) {
                echo "Error executing statement:\n$stmt\nError: " . $db->error . "\n";
                // Continue or exit? For safety, let's exit on error
                exit(1);
            }
        } catch (Exception $e) {
             echo "Exception executing statement:\n$stmt\nError: " . $e->getMessage() . "\n";
             exit(1);
        }
    }
    echo "Done " . basename($file) . "\n";
}

echo "All migrations completed successfully.\n";
