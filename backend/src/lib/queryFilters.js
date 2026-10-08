import { Prisma } from '@prisma/client'

export const UF_EXTERIOR = 'ZZ'
export const GENEROS = ['M', 'F', 'NI']

export function buildPerfilWhere({ uf = null, municipioId = null, genero = null } = {}) {
  const base = genero ? { genero } : {}

  if (municipioId) return { ...base, municipioId }
  if (uf)          return { ...base, municipio: { uf } }
  return { ...base, municipio: { uf: { not: UF_EXTERIOR } } }
}

export function buildPerfilWhereSql({ uf = null, municipioId = null, genero = null } = {}) {
  const generoSql = genero ? Prisma.sql`AND e."genero" = ${genero}` : Prisma.empty

  if (municipioId) return Prisma.sql`e."municipioId" = ${municipioId} ${generoSql}`
  if (uf)          return Prisma.sql`m."uf" = ${uf} ${generoSql}`
  return Prisma.sql`m."uf" <> ${UF_EXTERIOR} ${generoSql}`
}

/**
 * Validação e normalização de parâmetros de query string.
 * Rejeitar entradas malformadas na borda da aplicação evita que valores
 * inesperados se propaguem às camadas internas (fail fast).
 */
export function parseFilters(query) {
  const errors = []

  let uf = query.uf?.toString().trim().toUpperCase() || null
  if (uf && !/^[A-Z]{2}$/.test(uf)) {
    errors.push(`uf inválida: "${query.uf}" (esperado sigla de 2 letras)`)
    uf = null
  }

  let municipioId = null
  if (query.municipioId != null && query.municipioId !== '') {
    municipioId = Number(query.municipioId)
    if (!Number.isInteger(municipioId) || municipioId <= 0) {
      errors.push(`municipioId inválido: "${query.municipioId}"`)
      municipioId = null
    }
  }

  let genero = query.genero?.toString().trim().toUpperCase() || null
  if (genero && !GENEROS.includes(genero)) {
    errors.push(`genero inválido: "${query.genero}" (esperado M, F ou NI)`)
    genero = null
  }

  let limit = null
  if (query.limit != null && query.limit !== '') {
    limit = Number(query.limit)
    if (!Number.isInteger(limit) || limit <= 0 || limit > 6000) {
      errors.push(`limit inválido: "${query.limit}" (esperado 1–6000)`)
      limit = null
    }
  }

  return { filters: { uf, municipioId, genero, limit }, errors }
}
