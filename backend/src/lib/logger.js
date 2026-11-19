const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info

function emit(level, msg, meta = {}) {
  if (LEVELS[level] < MIN_LEVEL) return

  const line = JSON.stringify({
    ts:    new Date().toISOString(),
    level,
    msg,
    ...meta,
  })

  // stderr para warn/error facilita separação de streams no Docker
  if (LEVELS[level] >= LEVELS.warn) process.stderr.write(line + '\n')
  else                              process.stdout.write(line + '\n')
}

export const logger = {
  debug: (msg, meta) => emit('debug', msg, meta),
  info:  (msg, meta) => emit('info',  msg, meta),
  warn:  (msg, meta) => emit('warn',  msg, meta),
  error: (msg, meta) => emit('error', msg, meta),
}

export function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    logger.info('http_request', {
      method:  req.method,
      path:    req.originalUrl,
      status:  res.statusCode,
      ms:      Math.round(ms * 10) / 10,
    })
  })

  next()
}
