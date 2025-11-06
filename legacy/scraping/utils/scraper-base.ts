import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '../../crm-app/.env' });

// Find project root (directory containing package.json)
function findProjectRoot(): string {
  let currentDir = __dirname;
  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback to two levels up from utils
  return path.resolve(__dirname, '../..');
}

const PROJECT_ROOT = findProjectRoot();

export const getScrapingPaths = (municipality: string, sourceSystem: string = '') => {
  const jsonDir = process.env.SCRAPING_JSON_DIR || 'scraping/json';
  const logsDir = process.env.SCRAPING_LOGS_DIR || 'scraping/logs';

  // Ensure paths are absolute from project root
  const absoluteJsonDir = path.isAbsolute(jsonDir) ? jsonDir : path.join(PROJECT_ROOT, jsonDir);
  const absoluteLogsDir = path.isAbsolute(logsDir) ? logsDir : path.join(PROJECT_ROOT, logsDir);

  // Ensure directories exist
  if (!fs.existsSync(absoluteJsonDir)) {
    fs.mkdirSync(absoluteJsonDir, { recursive: true });
  }
  if (!fs.existsSync(absoluteLogsDir)) {
    fs.mkdirSync(absoluteLogsDir, { recursive: true });
  }

  // Format timestamp as YYYY-MM-DD_HH-MM
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

  // New naming format: <municipality>_<SOURCE_SYSTEM>_YYYY-MM-DD_HH-MM.json
  const baseFilename = sourceSystem
    ? `${municipality}_${sourceSystem}_${timestamp}`
    : `${municipality}_${timestamp}`;

  return {
    outputDir: absoluteJsonDir,
    jsonlPath: path.join(absoluteJsonDir, `${baseFilename}.jsonl`),
    jsonPath: path.join(absoluteJsonDir, `${baseFilename}.json`),
    logPath: path.join(absoluteLogsDir, `${municipality}.log`)
  };
};

export const runDatabaseImport = async (municipality: string, log: ((message: string) => void) | { info: (message: string) => void }) => {
  const logFn = typeof log === 'function' ? log : log.info;
  logFn('Running validation and import...');
  try {
    const { execSync } = await import('child_process');
    const crmAppDir = path.resolve(process.cwd(), 'crm-app');
    const importPath = path.resolve(crmAppDir, 'scripts/import-fixtures.ts');
    execSync(`cd "${crmAppDir}" && npx tsx "${importPath}" --mode=update --municipality="${municipality}"`, { stdio: 'inherit' });
    logFn('Import completed successfully.');
  } catch (error) {
    logFn(`Import failed: ${error}`);
  }
};

export const createLogger = (logPath: string) => {
  const logFn = (message: string): void => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    const fs = require('fs');
    fs.appendFileSync(logPath, logMessage + '\n');
  };

  return {
    info: logFn,
    error: logFn,
    warn: logFn,
    log: logFn
  };
};