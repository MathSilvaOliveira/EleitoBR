import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import {
  buildPerfilWhere,
  buildPerfilWhereSql,
  UF_EXTERIOR,
} from '../lib/queryFilters.js'

const ESC_BAIXA    = ['1', '2', '3']  // analfabeto, lê e escreve, fund. incompleto
const ESC_SUPERIOR = ['7', '8']       // superior incompleto, superior completo


export async function getGeneroPorFaixa(filters = {}) {
  const [rows, dimensoes] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:    ['faixaEtariaId', 'genero'],
      _sum:  { quantidade: true },
      where: buildPerfilWhere(filters),
    }),
    prisma.faixaEtaria.findMany(),
  ])

  const dimMap = new Map(dimensoes.map(d => [d.id, d]))
  const porFaixa = new Map()

  for (const row of rows) {
    const dim = dimMap.get(row.faixaEtariaId)
    const key = row.faixaEtariaId
    if (!porFaixa.has(key)) {
      porFaixa.set(key, {
        codigo:    dim?.codigo    ?? String(key),
        descricao: dim?.descricao ?? 'Desconhecida',
        M: 0, F: 0, NI: 0, total: 0,
      })
    }
    const alvo = porFaixa.get(key)
    const qt   = row._sum.quantidade ?? 0
    alvo[row.genero] = (alvo[row.genero] ?? 0) + qt
    alvo.total += qt
  }

  return [...porFaixa.values()]
    .sort((a, b) => ordFaixa(a.codigo) - ordFaixa(b.codigo))
}

function ordFaixa(codigo) {
  const n = Number(codigo)
  return Number.isFinite(n) && n > 0 ? n : Infinity
}

export async function getEscolaridadePorFaixa(filters = {}) {
  const [rows, escolaridades, faixas] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:    ['escolaridadeId', 'faixaEtariaId'],
      _sum:  { quantidade: true },
      where: buildPerfilWhere(filters),
    }),
    prisma.escolaridade.findMany(),
    prisma.faixaEtaria.findMany(),
  ])

  const escMap   = new Map(escolaridades.map(d => [d.id, d]))
  const faixaMap = new Map(faixas.map(d => [d.id, d]))

  const celulas = rows.map(row => ({
    escolaridade: escMap.get(row.escolaridadeId)?.codigo   ?? String(row.escolaridadeId),
    faixa:        faixaMap.get(row.faixaEtariaId)?.codigo  ?? String(row.faixaEtariaId),
    total:        row._sum.quantidade ?? 0,
  }))

  return {
    escolaridades: escolaridades
      .map(d => ({ codigo: d.codigo, descricao: d.descricao }))
      .sort((a, b) => Number(a.codigo) - Number(b.codigo)),
    faixas: faixas
      .map(d => ({ codigo: d.codigo, descricao: d.descricao }))
      .sort((a, b) => ordFaixa(a.codigo) - ordFaixa(b.codigo)),
    celulas,
  }
}

export async function getEscolaridadePorGenero(filters = {}) {
  const [rows, dimensoes] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:    ['escolaridadeId', 'genero'],
      _sum:  { quantidade: true },
      where: buildPerfilWhere(filters),
    }),
    prisma.escolaridade.findMany(),
  ])

  const dimMap = new Map(dimensoes.map(d => [d.id, d]))
  const porEsc = new Map()

  for (const row of rows) {
    const dim = dimMap.get(row.escolaridadeId)
    if (!porEsc.has(row.escolaridadeId)) {
      porEsc.set(row.escolaridadeId, {
        codigo:    dim?.codigo    ?? String(row.escolaridadeId),
        descricao: dim?.descricao ?? 'Desconhecida',
        M: 0, F: 0, NI: 0, total: 0,
      })
    }
    const alvo = porEsc.get(row.escolaridadeId)
    const qt   = row._sum.quantidade ?? 0
    alvo[row.genero] = (alvo[row.genero] ?? 0) + qt
    alvo.total += qt
  }

  return [...porEsc.values()].sort((a, b) => Number(a.codigo) - Number(b.codigo))
}

