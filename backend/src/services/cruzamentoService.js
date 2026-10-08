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

export async function getIndicadoresMunicipios(filters = {}) {
  const whereSql      = buildPerfilWhereSql({ uf: filters.uf })
  const limit         = filters.limit        ?? 15
  const minEleitores  = filters.minEleitores ?? 10_000

  // Whitelist de ordenação — nome de coluna NUNCA vem do usuário direto
  const orderMap = {
    total: Prisma.sql`total DESC`,
    iee:   Prisma.sql`iee DESC NULLS LAST`,
    hiato: Prisma.sql`hiato DESC NULLS LAST`,
  }
  const orderSql = orderMap[filters.orderBy] ?? orderMap.total

  // iee e hiato são derivados no SQL, e não no JS, para que o ORDER BY alcance os dois.
  // NULLIF mantém o IEE nulo quando não há jovens, em vez de estourar a divisão.
  const rows = await prisma.$queryRaw`
    WITH base AS (
      SELECT
        m."id",
        m."nome",
        m."uf",
        SUM(e."quantidade")::int AS total,
        SUM(CASE WHEN f."codigo" ~ '^[0-9]+$'
                  AND f."codigo"::int BETWEEN 1600 AND 2124
                 THEN e."quantidade" ELSE 0 END)::int AS jovens,
        SUM(CASE WHEN f."codigo" ~ '^[0-9]+$'
                  AND f."codigo"::int >= 6064
                 THEN e."quantidade" ELSE 0 END)::int AS idosos,
        SUM(CASE WHEN esc."codigo" IN ('1','2','3')
                 THEN e."quantidade" ELSE 0 END)::int AS baixa_instrucao,
        SUM(CASE WHEN esc."codigo" IN ('7','8')
                 THEN e."quantidade" ELSE 0 END)::int AS instrucao_superior
      FROM  "EleitoradoPerfil" e
      INNER JOIN "Municipio"    m   ON e."municipioId"    = m."id"
      INNER JOIN "FaixaEtaria"  f   ON e."faixaEtariaId"  = f."id"
      INNER JOIN "Escolaridade" esc ON e."escolaridadeId" = esc."id"
      WHERE ${whereSql}
      GROUP BY m."id", m."nome", m."uf"
      HAVING SUM(e."quantidade") >= ${minEleitores}
    )
    SELECT
      base.*,
      ROUND(idosos::numeric / NULLIF(jovens, 0), 2)::float8 AS iee,
      ROUND(((baixa_instrucao - instrucao_superior)::numeric
             / NULLIF(total, 0)) * 100, 1)::float8 AS hiato
    FROM base
    ORDER BY ${orderSql}
    LIMIT ${limit}
  `

  return rows.map(r => {
    const total = Number(r.total)
    const baixa = Number(r.baixa_instrucao)
    const sup   = Number(r.instrucao_superior)

    return {
      id:     r.id,
      nome:   r.nome,
      uf:     r.uf,
      total,
      iee:    r.iee,
      hiato:  r.hiato,
      pct_baixa_instrucao:    total > 0 ? Number(((baixa / total) * 100).toFixed(1)) : null,
      pct_instrucao_superior: total > 0 ? Number(((sup   / total) * 100).toFixed(1)) : null,
    }
  })
}


export async function getExterior(filters = {}) {
  const limit = filters.limit ?? 10
  const whereExterior = { municipio: { uf: UF_EXTERIOR } }

  const [aggr, generos, faixas, localidades] = await Promise.all([
    prisma.eleitoradoPerfil.aggregate({
      _sum:  { quantidade: true },
      where: whereExterior,
    }),

    prisma.eleitoradoPerfil.groupBy({
      by:    ['genero'],
      _sum:  { quantidade: true },
      where: whereExterior,
    }),

    getGeneroPorFaixa({ uf: UF_EXTERIOR }),

    prisma.$queryRaw`
      SELECT m."id", m."nome", SUM(e."quantidade")::int AS total
      FROM   "EleitoradoPerfil" e
      INNER  JOIN "Municipio" m ON e."municipioId" = m."id"
      WHERE  m."uf" = ${UF_EXTERIOR}
      GROUP  BY m."id", m."nome"
      ORDER  BY total DESC
      LIMIT  ${limit}
    `,
  ])

  const totalExterior = aggr._sum.quantidade ?? 0

  return {
    total: totalExterior,
    generos: generos.map(g => ({
      genero: g.genero,
      total:  g._sum.quantidade ?? 0,
    })),
    faixas,
    localidades: localidades.map(l => ({
      id:    l.id,
      nome:  l.nome,
      total: Number(l.total),
      pct:   totalExterior > 0
        ? Number(((Number(l.total) / totalExterior) * 100).toFixed(1))
        : null,
    })),
  }
}
