/**
 * Service Layer — EleitoSP
 *
 * Encapsula toda a lógica de acesso a dados da aplicação, isolando as rotas
 * de qualquer dependência direta do Prisma ou do banco de dados.
 *
 * Padrão Service Layer: "define an application's boundary with a layer of
 * services that establishes a set of available operations from the perspective
 * of interfacing client layers." (FOWLER, 2002, p. 133).
 *
 * Cada função aceita um objeto `filters` mesmo quando ainda não utilizado —
 * seguindo o Open/Closed Principle: aberto para extensão (adicionar filtros
 * futuros) sem modificar os callers (MARTIN, 2002).
 *
 * Referências:
 *   FOWLER, M. Patterns of Enterprise Application Architecture.
 *     Addison-Wesley, 2002. p. 133.
 *   MARTIN, R. C. Agile Software Development. Prentice Hall, 2002.
 *   KIMBALL, R.; ROSS, M. The Data Warehouse Toolkit. 3. ed. Wiley, 2013.
 *   ELMASRI, R.; NAVATHE, S. Fundamentals of Database Systems.
 *     7. ed. Pearson, 2016.
 *   WILSON, J. Node.js 8 the Right Way. Pragmatic Bookshelf, 2018.
 *   RICHARDSON, L. RESTful Web APIs. O'Reilly, 2013.
 */

import prisma from '../lib/prisma.js'

// ─── RESUMO ──────────────────────────────────────────────────────────────────

/**
 * Retorna totais gerais do eleitorado brasileiro.
 *
 * As quatro queries são independentes entre si e executadas em paralelo via
 * Promise.all, reduzindo a latência total de 4× o tempo de uma query para
 * 1× o tempo da mais lenta — técnica de concorrência I/O-bound recomendada
 * para ambientes Node.js orientados a eventos (WILSON, 2018, cap. 3).
 *
 * @param {Object} filters - { uf?: string } (reservado para uso futuro)
 * @returns {Promise<{total_brasil, total_sp, total_municipios, total_estados}>}
 */
export async function getResumo(filters = {}) {
  const [aggrBrasil, aggrSp, totalMunicipios, ufs] = await Promise.all([

    // SUM total Brasil — varredura completa da coluna quantidade
    prisma.eleitoradoPerfil.aggregate({
      _sum: { quantidade: true },
    }),

    // SUM total SP — Prisma traduz `municipio: { uf: 'SP' }` para
    // um JOIN com filtro WHERE m.uf = 'SP' no query engine
    prisma.eleitoradoPerfil.aggregate({
      _sum: { quantidade: true },
      where: { municipio: { uf: 'SP' } },
    }),

    // COUNT total de municípios cadastrados
    prisma.municipio.count(),

    // COUNT DISTINCT estados — agrupa por uf e conta os grupos
    // O schema não possui tabela Estado; uf é campo de Municipio
    prisma.municipio.groupBy({
       by: ['uf'],
       where: { uf: {not: 'ZZ' } },
      }),
  ])

  return {
    total_brasil:     aggrBrasil._sum.quantidade ?? 0,
    total_sp:         aggrSp._sum.quantidade     ?? 0,
    total_municipios: totalMunicipios,
    total_estados:    ufs.length,
  }
}

// ─── FAIXA ETÁRIA ─────────────────────────────────────────────────────────────

/**
 * Retorna distribuição de eleitores por faixa etária.
 *
 * Padrão de duas queries para tabelas de fato no modelo estrela (star schema):
 * (1) groupBy + _sum na tabela de fato (EleitoradoPerfil) pela FK da dimensão;
 * (2) findMany na tabela de dimensão (FaixaEtaria) para obter os descritores.
 * Join em memória via Map — tabela de dimensão tem < 30 registros.
 *
 * O Prisma 5 não suporta `include` em operações `groupBy`, tornando o padrão
 * de duas queries a abordagem recomendada pela documentação oficial do Prisma.
 *
 * Referência: KIMBALL, R.; ROSS, M. The Data Warehouse Toolkit. Wiley, 2013.
 *   p. 38: "The numeric fact columns represent measurements at the intersection
 *   of the dimension columns."
 *
 * @param {Object} filters - { uf?: string, municipioId?: number }
 * @returns {Promise<Array<{codigo, descricao, total}>>}
 */
export async function getFaixaEtaria(filters = {}) {
  const [rows, dimensoes] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:      ['faixaEtariaId'],
      _sum:    { quantidade: true },
      orderBy: { faixaEtariaId: 'asc' },
    }),
    prisma.faixaEtaria.findMany(),
  ])

  const dimMap = new Map(dimensoes.map(d => [d.id, d]))

  return rows.map(row => ({
    codigo:    dimMap.get(row.faixaEtariaId)?.codigo    ?? String(row.faixaEtariaId),
    descricao: dimMap.get(row.faixaEtariaId)?.descricao ?? 'Desconhecida',
    total:     row._sum.quantidade ?? 0,
  }))
}

// ─── GÊNERO ──────────────────────────────────────────────────────────────────

/**
 * Retorna distribuição de eleitores por gênero.
 *
 * `genero` é campo string direto em EleitoradoPerfil (não FK), portanto
 * groupBy agrupa diretamente sem necessidade de lookup em tabela de dimensão.
 * Valores possíveis: 'M', 'F', 'NI' — normalizados pelo ETL a partir dos
 * códigos numéricos do TSE.
 *
 * @param {Object} filters - { uf?: string, municipioId?: number }
 * @returns {Promise<Array<{genero, total}>>}
 */
export async function getGenero(filters = {}) {
  const rows = await prisma.eleitoradoPerfil.groupBy({
    by:      ['genero'],
    _sum:    { quantidade: true },
    orderBy: { genero: 'asc' },
  })

  return rows.map(row => ({
    genero: row.genero,
    total:  row._sum.quantidade ?? 0,
  }))
}

// ─── ESCOLARIDADE ─────────────────────────────────────────────────────────────

/**
 * Retorna distribuição de eleitores por grau de instrução.
 *
 * Mesmo padrão de duas queries de getFaixaEtaria — groupBy na tabela de fato
 * + lookup na dimensão Escolaridade (9 registros).
 *
 * Referência: KIMBALL; ROSS, 2013, p. 38.
 *
 * @param {Object} filters - { uf?: string, municipioId?: number }
 * @returns {Promise<Array<{codigo, descricao, total}>>}
 */
export async function getEscolaridade(filters = {}) {
  const [rows, dimensoes] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:      ['escolaridadeId'],
      _sum:    { quantidade: true },
      orderBy: { escolaridadeId: 'asc' },
    }),
    prisma.escolaridade.findMany(),
  ])

  const dimMap = new Map(dimensoes.map(d => [d.id, d]))

  return rows.map(row => ({
    codigo:    dimMap.get(row.escolaridadeId)?.codigo    ?? String(row.escolaridadeId),
    descricao: dimMap.get(row.escolaridadeId)?.descricao ?? 'Desconhecida',
    total:     row._sum.quantidade ?? 0,
  }))
}

// ─── MUNICÍPIOS ───────────────────────────────────────────────────────────────

/**
 * Retorna total de eleitores por município, ordenado decrescente.
 *
 * Padrão de duas queries: groupBy em EleitoradoPerfil por municipioId +
 * lookup em Municipio para nome e uf.
 *
 * filters.limit: parâmetro de paginação preparado para uso futuro.
 * Quando presente, aplica LIMIT ao resultado — padrão limit/offset descrito
 * em RICHARDSON, L. RESTful Web APIs. O'Reilly, 2013. cap. 5.
 *
 * @param {Object} filters - { uf?: string, limit?: number }
 * @returns {Promise<Array<{id, nome, uf, total}>>}
 */
export async function getMunicipios(filters = {}) {
  const [rows, municipios] = await Promise.all([
    prisma.eleitoradoPerfil.groupBy({
      by:      ['municipioId'],
      _sum:    { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
    }),
    prisma.municipio.findMany(),
  ])

  const munMap = new Map(municipios.map(m => [m.id, m]))

  const resultado = rows.map(row => {
    const m = munMap.get(row.municipioId)
    return {
      id:    row.municipioId,
      nome:  m?.nome ?? 'Desconhecido',
      uf:    m?.uf   ?? '??',
      total: row._sum.quantidade ?? 0,
    }
  })

  // Aplica limit se fornecido — preparado para uso futuro via ?limit=N
  return filters.limit ? resultado.slice(0, filters.limit) : resultado
}

// ─── REGIÕES (UFs) ────────────────────────────────────────────────────────────

/**
 * Retorna total de eleitores por UF (estado), ordenado decrescente.
 * Permite comparação SP vs demais estados do Brasil.
 *
 * O campo `uf` pertence à tabela Municipio, não à EleitoradoPerfil.
 * O Prisma 5 não suporta groupBy por campos de tabelas relacionadas via FK
 * (apenas por campos do próprio modelo). Por isso, utiliza-se $queryRaw com
 * SQL puro — abordagem recomendada pela documentação do Prisma quando o
 * query builder não suporta a operação necessária.
 *
 * O cast `::int` converte o resultado de SUM() de BIGINT (retorno padrão do
 * PostgreSQL para somas de inteiros) para INTEGER, evitando que o Prisma
 * deserialize o valor como BigInt do JavaScript — tipo não serializável
 * nativamente em JSON (ECMA-262, 2023).
 * O SUM máximo esperado (~35M para SP) está dentro do limite do INT4
 * (~2,1 bilhões), tornando o cast seguro.
 *
 * O índice @@index([uf]) declarado no schema Prisma para Municipio orienta
 * o planner do PostgreSQL a usar um Index Scan para o GROUP BY em uf
 * (ELMASRI; NAVATHE, 2016, cap. 5).
 *
 * Referências:
 *   ELMASRI, R.; NAVATHE, S. Fundamentals of Database Systems.
 *     7. ed. Pearson, 2016. cap. 5.
 *   PRISMA. Raw database access. Prisma Docs, 2024.
 *
 * @param {Object} filters - { uf?: string } (reservado para uso futuro)
 * @returns {Promise<Array<{uf, total}>>}
 */
export async function getRegioes(filters = {}) {
  const rows = await prisma.$queryRaw`
    SELECT m."uf", SUM(e."quantidade")::int AS total
    FROM   "EleitoradoPerfil" e
    INNER  JOIN "Municipio" m ON e."municipioId" = m."id"
    GROUP  BY m."uf"
    ORDER  BY total DESC
  `

  return rows.map(row => ({
    uf:    row.uf,
    total: Number(row.total),
  }))
}
