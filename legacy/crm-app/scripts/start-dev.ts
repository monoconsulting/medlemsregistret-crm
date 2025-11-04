import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

function isRunningInDocker(): boolean {
  if (process.env.DOCKER || process.env.DOCKER_CONTAINER || process.env.CONTAINER) {
    return true
  }

  if (existsSync('/.dockerenv')) {
    return true
  }

  try {
    const cgroup = readFileSync('/proc/1/cgroup', 'utf8')
    return cgroup.includes('docker') || cgroup.includes('containerd')
  } catch {
    return false
  }
}

const dockerDefaultPort = process.env.APP_PORT_INTERNAL ?? process.env.INTERNAL_APP_PORT ?? '3000'
const localDefaultPort = process.env.APP_PORT_DEV ?? '3020'

const runningInDocker = isRunningInDocker()
const preferredPort =
  process.env.PORT ||
  (runningInDocker ? dockerDefaultPort : localDefaultPort)

process.env.PORT = preferredPort

console.log(`[dev] runningInDocker=${runningInDocker} (PORT=${process.env.PORT})`)

console.log(`[dev] Starting Next.js on port ${preferredPort}`)

const child = spawn('next', ['dev', '-p', preferredPort], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
