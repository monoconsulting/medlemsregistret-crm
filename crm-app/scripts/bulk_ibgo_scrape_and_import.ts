/**
 * Bulk IBGO Scrape and Import (Combined)
 *
 * Runs both scraping and importing in sequence:
 * 1. Scrapes all IBGO municipalities
 * 2. Immediately imports the scraped data to database
 *
 * This is a convenience wrapper around bulk_ibgo_scrape and bulk_ibgo_import.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runCommand(command: string, description: string): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${description}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || "mysql://crm_user:crm_password_change_me@localhost:3316/crm_db"
      }
    });

    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
  } catch (error: any) {
    console.error(`Error executing ${description}:`, error.message);
    if (error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    throw error;
  }
}

async function main() {
  const overallStartTime = Date.now();

  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('║' + '  BULK IBGO SCRAPE AND IMPORT'.padEnd(57) + ' ║');
  console.log('║' + ' '.repeat(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\n');

  try {
    // Step 1: Run scraping
    await runCommand(
      'npx tsx scripts/bulk_ibgo_scrape.ts',
      'STEP 1: SCRAPING ALL IBGO MUNICIPALITIES'
    );

    console.log('\n✅ Scraping completed successfully!\n');

    // Small delay between steps
    console.log('Waiting 2 seconds before importing...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Run import
    await runCommand(
      'npx tsx scripts/bulk_ibgo_import.ts',
      'STEP 2: IMPORTING TO DATABASE'
    );

    console.log('\n✅ Import completed successfully!\n');

    const totalDuration = Date.now() - overallStartTime;
    const minutes = Math.floor(totalDuration / 60000);
    const seconds = ((totalDuration % 60000) / 1000).toFixed(1);

    console.log('\n');
    console.log('╔' + '═'.repeat(58) + '╗');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + '  ALL OPERATIONS COMPLETED SUCCESSFULLY!'.padEnd(57) + ' ║');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('║' + `  Total time: ${minutes}m ${seconds}s`.padEnd(57) + ' ║');
    console.log('║' + ' '.repeat(58) + '║');
    console.log('╚' + '═'.repeat(58) + '╝');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Process failed with error:', error);
    process.exit(1);
  }
}

main();
