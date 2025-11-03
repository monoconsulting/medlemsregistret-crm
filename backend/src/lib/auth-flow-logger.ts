import { appendFile, mkdir } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import type { Request } from 'express'

const LOG_DIRECTORY = path.resolve(process.cwd(), '..', 'logs')
const LOG_FILE = path.join(LOG_DIRECTORY, 'auth-flow.log')

let ensurePromise: Promise<void> | null = null

async function ensureLogFile(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      await mkdir(LOG_DIRECTORY, { recursive: true })
      if (!fs.existsSync(LOG_FILE)) {
        await appendFile(LOG_FILE, '', 'utf8')
      }
    })()
  }

  await ensurePromise
}

export const AUTH_FLOW_HEADER = 'X-Auth-Flow-Id'

export interface AuthFlowLogEntry {
  timestamp?: string
  source?: string
  flowId?: string | null
  stage: string
  severity?: 'debug' | 'info' | 'warn' | 'error'
  context?: Record<string, unknown>
  error?: { message: string; stack?: string }
}

function buildLine(entry: AuthFlowLogEntry): string {
  return `${JSON.stringify({
    severity: 'info',
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  })}\n`
}

export async function logAuthFlowEvent(entry: AuthFlowLogEntry): Promise<void> {
  try {
    await ensureLogFile()
    await appendFile(LOG_FILE, buildLine(entry), 'utf8')
  } catch (error) {
    console.error('[auth-flow] Failed to append backend log entry:', error)
  }
}

export const AUTH_FLOW_LOG_FILE = LOG_FILE

export function extractAuthFlowId(
  headers: Request['headers'] | Record<string, unknown>,
): string | null {
  if ('get' in headers && typeof headers.get === 'function') {
    return headers.get(AUTH_FLOW_HEADER) ?? headers.get(AUTH_FLOW_HEADER.toLowerCase()) ?? null
  }

  const lower = AUTH_FLOW_HEADER.toLowerCase()
  const candidate =
    (headers as Record<string, unknown>)[AUTH_FLOW_HEADER] ??
    (headers as Record<string, unknown>)[lower]

  if (!candidate) {
    return null
  }

  if (Array.isArray(candidate)) {
    return candidate[0] ?? null
  }

  return typeof candidate === 'string' ? candidate : null
}
