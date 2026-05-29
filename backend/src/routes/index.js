/**
 * Camada de Rotas — EleitoSP API
 *
 * Responsabilidade exclusiva: receber a requisição HTTP, extrair e validar
 * parâmetros, delegar ao Service Layer e retornar a resposta ao cliente.
 * Nenhuma lógica de negócio ou query de banco reside aqui — princípio de
 * separação de responsabilidades (FOWLER, 2002, p. 133).
 *
 * Tratamento de erros: try/catch com next(err) em cada handler encaminha
 * exceções ao middleware global de erros registrado em app.js, garantindo
 * resposta padronizada sem vazar stack traces ao cliente (OWASP, 2021).
 *
 * Arquitetura REST: endpoints nomeados como recursos no plural, método GET
 * para leitura, sem estado no servidor entre requisições (FIELDING, 2000).
 *
 * Referências:
 *   FIELDING, R. T. Architectural Styles and the Design of Network-based
 *     Software Architectures. PhD dissertation, UCI, 2000.
 *   FOWLER, M. Patterns of Enterprise Application Architecture.
 *     Addison-Wesley, 2002. p. 133.
 *   OWASP. OWASP Top Ten. 2021.
 */

import { Router } from 'express'
import * as service from '../services/eleitoradoService.js'

const router = Router()

// ── GET /api/resumo ────────────────────────────────────────────────────────────
router.get('/resumo', async (req, res, next) => {
  try {
    const filters = {
      uf: req.query.uf ?? null,
    }
    res.json(await service.getResumo(filters))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/faixa-etaria ──────────────────────────────────────────────────────
router.get('/faixa-etaria', async (req, res, next) => {
  try {
    const filters = {
      uf:          req.query.uf          ?? null,
      municipioId: req.query.municipioId ? Number(req.query.municipioId) : null,
    }
    res.json(await service.getFaixaEtaria(filters))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/genero ────────────────────────────────────────────────────────────
router.get('/genero', async (req, res, next) => {
  try {
    const filters = {
      uf:          req.query.uf          ?? null,
      municipioId: req.query.municipioId ? Number(req.query.municipioId) : null,
    }
    res.json(await service.getGenero(filters))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/escolaridade ──────────────────────────────────────────────────────
router.get('/escolaridade', async (req, res, next) => {
  try {
    const filters = {
      uf:          req.query.uf          ?? null,
      municipioId: req.query.municipioId ? Number(req.query.municipioId) : null,
    }
    res.json(await service.getEscolaridade(filters))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/municipios ────────────────────────────────────────────────────────
router.get('/municipios', async (req, res, next) => {
  try {
    const filters = {
      uf:    req.query.uf    ?? null,
      limit: req.query.limit ? Number(req.query.limit) : null,
    }
    res.json(await service.getMunicipios(filters))
  } catch (err) {
    next(err)
  }
})

// ── GET /api/regioes ───────────────────────────────────────────────────────────
router.get('/regioes', async (req, res, next) => {
  try {
    const filters = {
      uf: req.query.uf ?? null,
    }
    res.json(await service.getRegioes(filters))
  } catch (err) {
    next(err)
  }
})

export default router
