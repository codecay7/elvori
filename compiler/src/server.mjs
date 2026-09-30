import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'

const HOST = process.env.COMPILER_HOST || '127.0.0.1'
const PORT = Number(process.env.COMPILER_PORT || 8787)
const TOKEN = process.env.COMPILER_SERVICE_TOKEN

const MAX_LATEX_BYTES = 2_000_000
const MAX_PDF_BYTES = 10_000_000
const MAX_LOG_BYTES = 32_000
const COMPILE_TIMEOUT_MS = 30_000
const MEMORY_LIMIT = '512m'
const CPU_LIMIT = '1'
const PIDS_LIMIT = '256'
const NOFILE_LIMIT = '256:256'
const NPROC_LIMIT = '256:256'

const IMAGE =
  process.env.COMPILER_IMAGE || 'elvori/latex-compiler:local'

const JOB_ROOT = path.resolve(
  process.env.COMPILER_JOB_ROOT ||
    path.join(process.cwd(), 'compiler', 'jobs'),
)

function sendJson(res, status, body) {
  const payload = JSON.stringify(body)

  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(payload),
  })

  res.end(payload)
}

function safeTokenEqual(a, b) {
  if (!a || !b) return false

  const left = crypto.createHash('sha256').update(a).digest()
  const right = crypto.createHash('sha256').update(b).digest()

  return crypto.timingSafeEqual(left, right)
}

function authorized(req) {
  if (!TOKEN) return false

  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return false
  }

  return safeTokenEqual(header.slice(7), TOKEN)
}

async function readBody(req) {
  const chunks = []
  let total = 0

  for await (const chunk of req) {
    total += chunk.length

    if (total > MAX_LATEX_BYTES + 16_384) {
      throw Object.assign(new Error('request_too_large'), {
        statusCode: 413,
      })
    }

    chunks.push(chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}

function truncateLog(value) {
  if (!value) return ''

  const text = String(value)

  if (Buffer.byteLength(text, 'utf8') <= MAX_LOG_BYTES) {
    return text
  }

  return `${text.slice(0, MAX_LOG_BYTES)}\n[log truncated]`
}

function runDocker(jobDir) {
  return new Promise((resolve) => {
    const args = [
      'run',
      '--rm',

      // No network access.
      '--network',
      'none',

      // Immutable image filesystem.
      '--read-only',

      // Only /work and /tmp are writable.
      '--mount',
      `type=bind,src=${jobDir},dst=/work`,

      '--tmpfs',
      '/tmp:rw,nosuid,nodev,noexec,size=64m',

      // Never run the compiler as root.
      '--user',
      `${process.getuid()}:${process.getgid()}`,

      // Remove all Linux capabilities.
      '--cap-drop',
      'ALL',

      // Prevent privilege escalation.
      '--security-opt',
      'no-new-privileges=true',

      // Resource limits.
      '--cpus',
      CPU_LIMIT,
      '--memory',
      MEMORY_LIMIT,
      '--memory-swap',
      MEMORY_LIMIT,
      '--pids-limit',
      PIDS_LIMIT,
      '--ulimit',
      `nofile=${NOFILE_LIMIT}`,
      '--ulimit',
      `nproc=${NPROC_LIMIT}`,

      '--workdir',
      '/work',

      '--env',
      'HOME=/tmp',
      '--env',
      'TEXMFHOME=/tmp/texmf',
      '--env',
      'TEXMFVAR=/tmp/texmf-var',

      IMAGE,

      'pdflatex',
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-file-line-error',
      '-no-shell-escape',
      '-output-directory=/work',
      '/work/main.tex',
    ]

    const child = spawn('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      finish({
        ok: false,
        code: null,
        signal: null,
        stdout,
        stderr: error.message,
        timedOut: false,
      })
    })

    child.on('close', (code, signal) => {
      finish({
        ok: code === 0,
        code,
        signal,
        stdout,
        stderr,
        timedOut: false,
      })
    })

    const timer = setTimeout(() => {
      if (settled) return

      child.kill('SIGKILL')

      finish({
        ok: false,
        code: null,
        signal: 'SIGKILL',
        stdout,
        stderr: `${stderr}\nCompilation timed out after ${COMPILE_TIMEOUT_MS}ms.`,
        timedOut: true,
      })
    }, COMPILE_TIMEOUT_MS)
  })
}

async function compile(latex) {
  const jobDir = await fs.mkdtemp(
    path.join(JOB_ROOT, 'job-'),
  )

  try {
    // Keep each compilation workspace private to the compiler process.
    await fs.chmod(jobDir, 0o700)

    const sourcePath = path.join(jobDir, 'main.tex')

    await fs.writeFile(sourcePath, latex, {
      encoding: 'utf8',
      mode: 0o600,
    })

    const startedAt = Date.now()
    const result = await runDocker(jobDir)
    const durationMs = Date.now() - startedAt

    const log = truncateLog(
      [result.stdout, result.stderr]
        .filter(Boolean)
        .join('\n'),
    )

    if (result.timedOut) {
      return {
        ok: false,
        status: 504,
        durationMs,
        log,
      }
    }

    if (!result.ok) {
      return {
        ok: false,
        status: 422,
        durationMs,
        log,
      }
    }

    const pdfPath = path.join(jobDir, 'main.pdf')

    let pdf

    try {
      pdf = await fs.readFile(pdfPath)
    } catch {
      return {
        ok: false,
        status: 422,
        durationMs,
        log: `${log}\nCompiler completed without producing a PDF.`,
      }
    }

    if (pdf.length === 0 || pdf.length > MAX_PDF_BYTES) {
      return {
        ok: false,
        status: 422,
        durationMs,
        log: `${log}\nGenerated PDF exceeded the allowed size.`,
      }
    }

    if (
      pdf.length < 5 ||
      pdf.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
      return {
        ok: false,
        status: 422,
        durationMs,
        log: `${log}\nCompiler output was not a valid PDF.`,
      }
    }

    return {
      ok: true,
      status: 200,
      durationMs,
      log,
      pdf,
    }
  } finally {
    await fs.rm(jobDir, {
      recursive: true,
      force: true,
    })
  }
}

async function handle(req, res) {
  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res, 200, {
      ok: true,
      service: 'elvori-compiler',
    })
  }

  if (req.method !== 'POST' || req.url !== '/compile') {
    return sendJson(res, 404, {
      error: 'Not found.',
    })
  }

  if (!authorized(req)) {
    return sendJson(res, 401, {
      error: 'Unauthorized.',
    })
  }

  if (
    req.headers['content-type'] !==
    'application/json'
  ) {
    return sendJson(res, 415, {
      error: 'Content-Type must be application/json.',
    })
  }

  let rawBody

  try {
    rawBody = await readBody(req)
  } catch (error) {
    return sendJson(
      res,
      error.statusCode === 413 ? 413 : 400,
      {
        error:
          error.statusCode === 413
            ? 'Request too large.'
            : 'Invalid request.',
      },
    )
  }

  let body

  try {
    body = JSON.parse(rawBody)
  } catch {
    return sendJson(res, 400, {
      error: 'Invalid JSON.',
    })
  }

  if (
    typeof body?.latex !== 'string' ||
    Buffer.byteLength(body.latex, 'utf8') >
      MAX_LATEX_BYTES
  ) {
    return sendJson(res, 413, {
      error: 'LaTeX source exceeds the allowed size.',
    })
  }

  const result = await compile(body.latex)

  if (!result.ok) {
    return sendJson(res, result.status, {
      error:
        result.status === 504
          ? 'Compilation timed out.'
          : 'LaTeX compilation failed.',
      log: result.log,
      duration_ms: result.durationMs,
    })
  }

  res.writeHead(200, {
    'content-type': 'application/pdf',
    'content-disposition': 'inline; filename="document.pdf"',
    'cache-control': 'no-store',
    'content-length': result.pdf.length,
    'x-compiler-duration-ms': String(
      result.durationMs,
    ),
  })

  res.end(result.pdf)
}

if (!TOKEN) {
  console.error(
    'COMPILER_SERVICE_TOKEN is required.',
  )
  process.exit(1)
}

await fs.mkdir(JOB_ROOT, {
  recursive: true,
})

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    console.error('Compiler service error:', error)

    if (!res.headersSent) {
      sendJson(res, 500, {
        error: 'Internal compiler service error.',
        detail: error instanceof Error ? error.message : String(error),
      })
    } else {
      res.destroy()
    }
  })
})

server.requestTimeout = COMPILE_TIMEOUT_MS + 5_000
server.headersTimeout = 10_000
server.keepAliveTimeout = 5_000

server.listen(PORT, HOST, () => {
  console.log(
    `Elvori compiler listening on http://${HOST}:${PORT}`,
  )
  console.log(`Compiler image: ${IMAGE}`)
})
