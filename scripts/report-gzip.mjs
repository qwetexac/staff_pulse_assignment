import { gzipSync } from 'node:zlib'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const DIST_DIR = path.resolve('dist')
const GZIP_BUDGET_BYTES = 200 * 1024
const COUNTED_EXTENSIONS = new Set(['.js', '.css', '.svg', '.html'])

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        return walk(fullPath)
      }
      return [fullPath]
    }),
  )
  return nested.flat()
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

const files = await walk(DIST_DIR)
const rows = []

let jsCssGzip = 0
let totalGzip = 0

for (const file of files) {
  const extension = path.extname(file)
  if (!COUNTED_EXTENSIONS.has(extension)) {
    continue
  }
  const buffer = await readFile(file)
  const gzipBytes = gzipSync(buffer).byteLength
  const rawBytes = (await stat(file)).size
  totalGzip += gzipBytes
  if (extension === '.js' || extension === '.css') {
    jsCssGzip += gzipBytes
  }
  rows.push({
    file: path.relative(DIST_DIR, file),
    rawBytes,
    gzipBytes,
  })
}

rows.sort((left, right) => right.gzipBytes - left.gzipBytes)

console.log('Production gzip sizes (dist):\n')
for (const row of rows) {
  console.log(
    `${row.file.padEnd(48)} raw ${formatKb(row.rawBytes).padStart(8)}  gzip ${formatKb(row.gzipBytes).padStart(8)}`,
  )
}

console.log('')
console.log(`JS + CSS gzip: ${formatKb(jsCssGzip)} (${jsCssGzip} bytes)`)
console.log(`All counted gzip: ${formatKb(totalGzip)} (${totalGzip} bytes)`)
console.log(`Budget: ${formatKb(GZIP_BUDGET_BYTES)} (${GZIP_BUDGET_BYTES} bytes)`)
console.log(
  jsCssGzip <= GZIP_BUDGET_BYTES
    ? 'Result: UNDER budget (JS + CSS gzip).'
    : 'Result: OVER budget (JS + CSS gzip).',
)
