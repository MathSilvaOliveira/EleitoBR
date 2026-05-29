import express from 'express'
import cors    from 'cors'
import router  from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', router)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', projeto: 'EleitoSP' })
})

/**
 * Middleware global de tratamento de erros.
 *
 * Deve ser registrado APÓS todas as rotas — Express identifica um error
 * middleware pela assinatura de 4 parâmetros (err, req, res, next) e só
 * o invoca quando next(err) é chamado em algum handler anterior.
 *
 * O stack trace é exposto apenas em ambiente de desenvolvimento, evitando
 * vazamento de informações internas ao cliente em produção — princípio de
 * defesa em profundidade (OWASP Top Ten, 2021).
 *
 * Referências:
 *   FIELDING, R. T. Architectural Styles... UCI, 2000. sec. 6.3.
 *   OWASP. OWASP Top Ten. 2021.
 */
app.use((err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500

  console.error(`[EleitoSP API Error] ${req.method} ${req.path}`, err.message)

  res.status(status).json({
    error:   err.name    ?? 'InternalServerError',
    message: err.message ?? 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

export default app
