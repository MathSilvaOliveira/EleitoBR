import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import {
  buildPerfilWhere,
  buildPerfilWhereSql,
  UF_EXTERIOR,
} from '../lib/queryFilters.js'


export async function getResumo(filters = {}) {
  const temFiltro = Boolean(filters.uf || filters.municipioId || filters.genero)

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


export async function getMunicipios(filters = {}) {
  if (filters.municipioId) {
    return prisma.municipio.findMany({
      where:  { id: filters.municipioId },
      select: { id: true, nome: true, uf: true },
    })
  }

  if (filters.q) {
    const termo = filters.q.replace(/[\\%_]/g, '\\$&')
    const ufSql = filters.uf
      ? Prisma.sql`"uf" = ${filters.uf}`
      : Prisma.sql`"uf" <> ${UF_EXTERIOR}`

    return prisma.$queryRaw`
      SELECT "id", "nome", "uf"
      FROM   "Municipio"
      WHERE  ${ufSql} AND unaccent("nome") ILIKE unaccent(${`%${termo}%`})
      ORDER  BY unaccent("nome") ILIKE unaccent(${termo}) DESC,
                unaccent("nome") ILIKE unaccent(${`${termo}%`}) DESC,
                "nome"
      LIMIT  ${filters.limit ?? 20}
    `
  }

  return prisma.municipio.findMany({
    where:   { uf: filters.uf ? filters.uf : { not: UF_EXTERIOR } },
    select:  { id: true, nome: true, uf: true },
    orderBy: { nome: 'asc' },
    take:    filters.limit ?? 20,
  })
}

export async function getRankingMunicipios(filters = {}) {
  const whereSql = buildPerfilWhereSql({ uf: filters.uf, genero: filters.genero })
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

export async function getRegioes(filters = {}) {
  const whereSql = buildPerfilWhereSql({ genero: filters.genero })

  const rows = await prisma.$queryRaw`
    SELECT m."uf", SUM(e."quantidade")::int AS total
    FROM   "EleitoradoPerfil" e
    INNER  JOIN "Municipio" m ON e."municipioId" = m."id"
    WHERE  ${whereSql}
    GROUP  BY m."uf"
    ORDER  BY total DESC
  `

  return rows.map(row => ({
    uf:    row.uf,
    total: Number(row.total),
  }))
}

export async function getImportacao() {
  const r = await prisma.importacao.findFirst({ orderBy: { carregadoEm: 'desc' } })
  if (!r) return null

  return {
    arquivo:            r.arquivo,
    bytes:              Number(r.bytes),
    sha256:             r.sha256,
    baixado_em:         r.baixadoEm,
    carregado_em:       r.carregadoEm,
    linhas_lidas:       r.linhasLidas,
    registros_gravados: r.registrosGravados,
    municipios:         r.municipios,
    observacao:         r.observacao,
  }
}
