import { config as loadEnv } from 'dotenv'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { generateOrgTree } from './generateOrgTree.ts'

loadEnv()

const DEFAULT_PORT = 4000
const MOCK_API_DELAY_MS = 400

const PORT = Number(process.env.PORT ?? DEFAULT_PORT)

/** Set MOCK_FORCE=empty|error to exercise client empty/error states. */
const FORCE_MODE = process.env.MOCK_FORCE ?? ''

const orgTree = generateOrgTree()

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end(payload)
}

function handleOptions(response: ServerResponse): void {
  response.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end()
}

async function handleOrgTree(
  _request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  await delay(MOCK_API_DELAY_MS)

  if (FORCE_MODE === 'empty') {
    sendJson(response, 200, [])
    return
  }

  if (FORCE_MODE === 'error') {
    sendJson(response, 500, { message: 'Forced mock-server error' })
    return
  }

  sendJson(response, 200, orgTree)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

const server = createServer((request, response) => {
  const method = request.method ?? 'GET'
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`)

  if (method === 'OPTIONS') {
    handleOptions(response)
    return
  }

  if (method === 'GET' && url.pathname === '/api/org-tree') {
    void handleOrgTree(request, response)
    return
  }

  sendJson(response, 404, { message: `Not found: ${url.pathname}` })
})

server.listen(PORT, () => {
  console.log(
    `[mock-server] listening on http://localhost:${PORT} (${orgTree.length} org nodes)`,
  )
  if (FORCE_MODE) {
    console.log(`[mock-server] MOCK_FORCE=${FORCE_MODE}`)
  }
})
