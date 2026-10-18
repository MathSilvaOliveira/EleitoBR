import express from 'express'
import cors    from 'cors'
import router  from './routes/index.js'
import { logger, requestLogger } from './lib/logger.js'

const app = express()

app.use(cors())
app.use(express.json())

// Log estruturado de todas as requisições (método, rota, status, latência)
app.use(requestLogger)

app.use('/api', router)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', projeto: 'EleitoBR' })
})

app.use((err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500

  logger.error('unhandled_error', {
    method: req.method,
    path:   req.originalUrl,
    status,
    error:  err.name,
    detail: err.message,
  })

  res.status(status).json({
    error:   err.name    ?? 'InternalServerError',
    message: err.message ?? 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

export default app
