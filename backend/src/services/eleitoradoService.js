import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import {
  buildPerfilWhere,
  buildPerfilWhereSql,
  UF_EXTERIOR,
} from '../lib/queryFilters.js'

// ─── RESUMO ──────────────────────────────────────────────────────────────────

export async function getResumo(filters = {}) {
  const temFiltro = Boolean(filters.uf || filters.municipioId)

  const [aggrBrasil, aggrExterior, aggrSelecao, totalMunicipios, ufs] =
    await Promise.all([
      prisma.eleitoradoPerfil.aggregate({
        _sum:  { quantidade: true },
        where: { municipio: { uf: { not: UF_EXTERIOR } } },
      }),

      prisma.eleitoradoPerfil.aggregate({
        _sum:  { quantidade: true },
        where: { municipio: { uf: UF_EXTERIOR } },
      }),

      temFiltro
        ? prisma.eleitoradoPerfil.aggregate({
            _sum:  { quantidade: true },
            where: buildPerfilWhere(filters),
          })
        : Promise.resolve(null),

      prisma.municipio.count({
        where: { uf: { not: UF_EXTERIOR } },
      }),

      prisma.municipio.groupBy({
        by:    ['uf'],
        where: { uf: { not: UF_EXTERIOR } },
      }),
    ])

  return {
    total_brasil:     aggrBrasil._sum.quantidade   ?? 0,
    total_exterior:   aggrExterior._sum.quantidade ?? 0,
    total_selecao:    aggrSelecao?._sum.quantidade ?? null,
    total_municipios: totalMunicipios,
    total_estados:    ufs.length,
  }
}

// ─── FAIXA ETÁRIA ─────────────────────────────────────────────────────────────

export async function getFaixaEtaria(filters = {}) {
  const [rows, dimensoes] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:      ['faixaEtariaId'],
      _sum:    { quantidade: true },
      where:   buildPerfilWhere(filters),
      orderBy: { faixaEtariaId: 'asc' },
    }),
    prisma.faixaEtaria.findMany(),
  ])

  const dimMap = new Map(dimensoes.map(d => [d.id, d]))

  return rows
    .map(row => ({
      codigo:    dimMap.get(row.faixaEtariaId)?.codigo    ?? String(row.faixaEtariaId),
      descricao: dimMap.get(row.faixaEtariaId)?.descricao ?? 'Desconhecida',
      total:     row._sum.quantidade ?? 0,
    }))
    // Ordena pela idade real (código numérico do TSE); inválidas ao final
    .sort((a, b) => faixaOrd(a.codigo) - faixaOrd(b.codigo))
}

function faixaOrd(codigo) {
  const n = Number(codigo)
  return Number.isFinite(n) && n > 0 ? n : Infinity
}

// ─── GÊNERO ──────────────────────────────────────────────────────────────────

/** @param {{ uf?: string, municipioId?: number }} filters */
export async function getGenero(filters = {}) {
  const rows = await prisma.eleitoradoPerfil.groupBy({
    by:      ['genero'],
    _sum:    { quantidade: true },
    where:   buildPerfilWhere(filters),
    orderBy: { genero: 'asc' },
  })

  return rows.map(row => ({
    genero: row.genero,
    total:  row._sum.quantidade ?? 0,
  }))
}

// ─── ESCOLARIDADE ─────────────────────────────────────────────────────────────

/** @param {{ uf?: string, municipioId?: number }} filters */
export async function getEscolaridade(filters = {}) {
  const [rows, dimensoes] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:      ['escolaridadeId'],
      _sum:    { quantidade: true },
      where:   buildPerfilWhere(filters),
      orderBy: { escolaridadeId: 'asc' },
    }),
    prisma.escolaridade.findMany(),
  ])

  const dimMap = new Map(dimensoes.map(d => [d.id, d]))

  return rows
    .map(row => ({
      codigo:    dimMap.get(row.escolaridadeId)?.codigo    ?? String(row.escolaridadeId),
      descricao: dimMap.get(row.escolaridadeId)?.descricao ?? 'Desconhecida',
      total:     row._sum.quantidade ?? 0,
    }))
    .sort((a, b) => Number(a.codigo) - Number(b.codigo))
}

// ─── MUNICÍPIOS (busca leve p/ autocomplete) ─────────────────────────────────

export async function getMunicipios(filters = {}) {
  const where = {}

  where.uf = filters.uf ? filters.uf : { not: UF_EXTERIOR }
  if (filters.q) {
    where.nome = { contains: filters.q, mode: 'insensitive' }
  }

  return prisma.municipio.findMany({
    where,
    select:  { id: true, nome: true, uf: true },
    orderBy: { nome: 'asc' },
    take:    filters.limit ?? 20,
  })
}

// ─── RANKING DE MUNICÍPIOS ───────────────────────────────────────────────────

export async function getRankingMunicipios(filters = {}) {
  const whereSql = buildPerfilWhereSql({ uf: filters.uf })
  const limit    = filters.limit ?? 15

  const rows = await prisma.$queryRaw`
    SELECT m."id", m."nome", m."uf", SUM(e."quantidade")::int AS total
    FROM   "EleitoradoPerfil" e
    INNER  JOIN "Municipio" m ON e."municipioId" = m."id"
    WHERE  ${whereSql}
    GROUP  BY m."id", m."nome", m."uf"
    ORDER  BY total DESC
    LIMIT  ${limit}
  `

  return rows.map(r => ({
    id:    r.id,
    nome:  r.nome,
    uf:    r.uf,
    total: Number(r.total),
  }))
}

// ─── REGIÕES (UFs) ────────────────────────────────────────────────────────────

export async function getRegioes() {
  const rows = await prisma.$queryRaw`
    SELECT m."uf", SUM(e."quantidade")::int AS total
    FROM   "EleitoradoPerfil" e
    INNER  JOIN "Municipio" m ON e."municipioId" = m."id"
    WHERE  m."uf" <> ${UF_EXTERIOR}
    GROUP  BY m."uf"
    ORDER  BY total DESC
  `

  return rows.map(row => ({
    uf:    row.uf,
    total: Number(row.total),
  }))
}
