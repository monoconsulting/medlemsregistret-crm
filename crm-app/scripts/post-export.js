#!/usr/bin/env node

/**
 * Post-export script to create detail.html for query parameter routes
 * This is needed because Next.js static export doesn't create HTML files for
 * routes that use useSearchParams()
 */

const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '../out')
const groupsDir = path.join(outDir, 'groups')
const detailDir = path.join(groupsDir, 'detail')

// Create detail directory
if (!fs.existsSync(detailDir)) {
  fs.mkdirSync(detailDir, { recursive: true })
}

// Read the detail page from .next/server
const detailHtmlSource = path.join(__dirname, '../.next/server/app/groups/detail.html')
const detailRscSource = path.join(__dirname, '../.next/server/app/groups/detail.rsc')
const detailHtmlOut = path.join(detailDir, 'index.html')
const detailRscOut = path.join(detailDir, 'index.txt')
const groupsIndexHtml = path.join(groupsDir, 'index.html')

if (fs.existsSync(detailHtmlSource)) {
  fs.copyFileSync(detailHtmlSource, detailHtmlOut)
  console.log('✓ Created /groups/detail/index.html')
} else if (fs.existsSync(groupsIndexHtml)) {
  fs.copyFileSync(groupsIndexHtml, detailHtmlOut)
  console.warn('! Missing detail.html, copied /groups/index.html instead')
} else {
  console.error('✗ Could not find a source HTML file for /groups/detail')
  process.exit(1)
}

if (fs.existsSync(detailRscSource)) {
  fs.copyFileSync(detailRscSource, detailRscOut)
  console.log('✓ Created /groups/detail/index.txt')
} else {
  console.error('✗ Could not find detail.rsc required for /groups/detail/index.txt')
  process.exit(1)
}
