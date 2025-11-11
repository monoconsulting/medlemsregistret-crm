import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const buildDir = path.join(projectRoot, '.next')
const appServerDir = path.join(buildDir, 'server', 'app')
const staticDir = path.join(buildDir, 'static')
const publicDir = path.join(projectRoot, 'public')
const outDir = path.join(projectRoot, 'out')

const normalize = (p) => p.replace(/\\/g, '/')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest))
  fs.copyFileSync(src, dest)
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath)
    }
  }
}

function buildOut() {
  if (!fs.existsSync(buildDir)) {
    throw new Error(`Missing build directory: ${buildDir}`)
  }
  if (!fs.existsSync(appServerDir)) {
    throw new Error(`Missing app server directory: ${appServerDir}`)
  }

  fs.rmSync(outDir, { recursive: true, force: true })
  ensureDir(outDir)

  const walkFiles = (dir) => {
    const files = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...walkFiles(entryPath))
      } else if (entry.isFile()) {
        files.push(entryPath)
      }
    }
    return files
  }

  const appFiles = walkFiles(appServerDir)
  const htmlFiles = appFiles.filter((filePath) => filePath.endsWith('.html'))
  const rscFiles = appFiles.filter((filePath) => filePath.endsWith('.rsc'))

  const writeRouteFile = (route, src, fileName) => {
    if (route === '_not-found') {
      copyFile(src, path.join(outDir, fileName === 'index.html' ? '404.html' : '404.txt'))
      return
    }

    if (route === 'index') {
      copyFile(src, path.join(outDir, fileName))
      return
    }

    const segments = route.split('/').filter(Boolean)
    const destDir = path.join(outDir, ...segments)
    ensureDir(destDir)
    copyFile(src, path.join(destDir, fileName))
  }

  for (const filePath of htmlFiles) {
    const route = normalize(path.relative(appServerDir, filePath)).replace(/\.html$/, '')
    writeRouteFile(route, filePath, 'index.html')
  }

  for (const filePath of rscFiles) {
    const route = normalize(path.relative(appServerDir, filePath)).replace(/\.rsc$/, '')
    writeRouteFile(route, filePath, 'index.txt')
  }

  // Copy public assets
  copyDir(publicDir, outDir)

  // Copy Next static assets
  const nextStaticDir = path.join(outDir, '_next', 'static')
  copyDir(staticDir, nextStaticDir)

  // Copy build id for cache busting
  const buildIdFile = path.join(buildDir, 'BUILD_ID')
  if (fs.existsSync(buildIdFile)) {
    copyFile(buildIdFile, path.join(outDir, '_next', 'BUILD_ID'))
  }

  // Copy static app assets (app-specific static chunks)
  const appStaticDir = path.join(buildDir, 'server', 'app')
  const assetEntries = fs.readdirSync(appStaticDir, { withFileTypes: true })
  for (const entry of assetEntries) {
    if (!entry.isFile()) continue
    const fileName = entry.name
    if (fileName.endsWith('.rsc') || fileName.endsWith('.meta')) continue
    if (fileName.endsWith('.html')) continue
    copyFile(path.join(appStaticDir, fileName), path.join(outDir, '_next', 'app', fileName))
  }

  console.log(`Static output created at ${normalize(outDir)}`)
}

buildOut()
