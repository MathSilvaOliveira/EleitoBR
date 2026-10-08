import { Router } from 'express'
import * as service     from '../services/eleitoradoService.js'
import * as cruzamentos from '../services/cruzamentoService.js'
import { parseFilters } from '../lib/queryFilters.js'

const router = Router()

function handler(fn) {
  return async (req, res, next) => {
    try {
      const { filters, errors } = parseFilters(req.query)
      if (errors.length > 0) {
        return res.status(400).json({ error: 'BadRequest', detalhes: errors })
      }
      res.json(await fn(filters, req))
    } catch (err) {
      next(err)
    }
  }
}

// ── Consultas de dimensão única ────────────────────────────────────────────
router.get('/resumo',       handler(f => service.getResumo(f)))
router.get('/faixa-etaria', handler(f => service.getFaixaEtaria(f)))
router.get('/genero',       handler(f => service.getGenero(f)))
router.get('/escolaridade', handler(f => service.getEscolaridade(f)))
router.get('/regioes',      handler(f => service.getRegioes(f)))

// ── Municípios ─────────────────────────────────────────────────────────────
router.get('/municipios', handler((f, req) =>
  service.getMunicipios({ ...f, q: req.query.q?.toString().trim() || null })))

router.get('/municipios/ranking', handler(f =>
  service.getRankingMunicipios(f)))

// ── Cruzamentos ────────────────────────────────────────────────────────────
router.get('/cruzamentos/genero-faixa', handler(f =>
  cruzamentos.getGeneroPorFaixa(f)))

router.get('/cruzamentos/escolaridade-faixa', handler(f =>
  cruzamentos.getEscolaridadePorFaixa(f)))

router.get('/cruzamentos/escolaridade-genero', handler(f =>
  cruzamentos.getEscolaridadePorGenero(f)))

// ── Indicadores originais ──────────────────────────────────────────────────
router.get('/indicadores/municipios', handler((f, req) => {
  const orderBy = ['total', 'iee', 'hiato'].includes(req.query.orderBy)
    ? req.query.orderBy
    : 'total'

  const direcao = ['asc', 'desc'].includes(req.query.direcao)
    ? req.query.direcao
    : 'desc'

  const minEleitores = Number(req.query.minEleitores)
  return cruzamentos.getIndicadoresMunicipios({
    ...f,
    orderBy,
    direcao,
    minEleitores: Number.isInteger(minEleitores) && minEleitores >= 0
      ? minEleitores
      : undefined,
  })
}))

// ── Procedência dos dados ──────────────────────────────────────────────────
router.get('/importacao', handler(() => service.getImportacao()))

// ── Exterior (ZZ) ──────────────────────────────────────────────────────────
router.get('/exterior', handler(f => cruzamentos.getExterior(f)))

export default router
