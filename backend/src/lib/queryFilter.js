import { Prisma } from '@prisma/client'

export const UF_EXTERIOR = 'ZZ'

export function buildPerfilWhere({ uf = null, municipioId = null } = {}) {
  if (municipioId) return { municipioId }
  if (uf)          return { municipio: { uf } }
  return { municipio: { uf: { not: UF_EXTERIOR } } }
}

export function buildPerfilWhereSql({ uf = null, municipioId = null } = {}) {
  if (municipioId) return Prisma.sql`e."municipioId" = ${municipioId}`
  if (uf)          return Prisma.sql`m."uf" = ${uf}`
  return Prisma.sql`m."uf" <> ${UF_EXTERIOR}`
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

  let limit = null
  if (query.limit != null && query.limit !== '') {
    limit = Number(query.limit)
    if (!Number.isInteger(limit) || limit <= 0 || limit > 6000) {
      errors.push(`limit inválido: "${query.limit}" (esperado 1–6000)`)
      limit = null
    }
  }

  return { filters: { uf, municipioId, limit }, errors }
}
