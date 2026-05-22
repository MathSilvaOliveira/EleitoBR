import { Router } from 'express'

const router = Router()

router.get('/resumo', (req, res) => {
  res.json({ total_eleitores: 0, mensagem: 'ETL ainda não executado' })
})

router.get('/faixa-etaria', (req, res) => {
  res.json([])
})

router.get('/genero', (req, res) => {
  res.json([])
})

router.get('/escolaridade', (req, res) => {
  res.json([])
})

router.get('/municipios', (req, res) => {
  res.json([])
})

router.get('/regioes', (req, res) => {
  res.json([])
})

export default router