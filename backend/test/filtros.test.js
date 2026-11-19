import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { parseFilters } from '../src/lib/queryFilters.js'

describe('parseFilters', () => {
  it('normaliza uf para maiúsculas', () => {
    assert.equal(parseFilters({ uf: ' sp ' }).filters.uf, 'SP')
  })

  it('rejeita uf fora do formato de sigla', () => {
    const { filters, errors } = parseFilters({ uf: 'SAO' })
    assert.equal(filters.uf, null)
    assert.equal(errors.length, 1)
  })

  it('aceita os três gêneros da base do TSE', () => {
    for (const g of ['M', 'F', 'NI']) {
      assert.equal(parseFilters({ genero: g }).filters.genero, g)
    }
  })

  it('normaliza gênero para maiúsculas', () => {
    assert.equal(parseFilters({ genero: 'f' }).filters.genero, 'F')
  })

  it('rejeita gênero desconhecido', () => {
    const { filters, errors } = parseFilters({ genero: 'X' })
    assert.equal(filters.genero, null)
    assert.match(errors[0], /genero inválido/)
  })

  it('rejeita municipioId não inteiro ou negativo', () => {
    assert.equal(parseFilters({ municipioId: 'abc' }).filters.municipioId, null)
    assert.equal(parseFilters({ municipioId: '-1' }).filters.municipioId, null)
  })

  it('rejeita limit fora da faixa permitida', () => {
    assert.equal(parseFilters({ limit: '0' }).filters.limit, null)
    assert.equal(parseFilters({ limit: '6001' }).filters.limit, null)
    assert.equal(parseFilters({ limit: '15' }).filters.limit, 15)
  })

  it('não acusa erro quando nenhum filtro é enviado', () => {
    const { filters, errors } = parseFilters({})
    assert.deepEqual(errors, [])
    assert.deepEqual(filters, { uf: null, municipioId: null, genero: null, limit: null })
  })

  it('acumula múltiplos erros em uma só resposta', () => {
    const { errors } = parseFilters({ uf: 'SAO', genero: 'X', limit: '0' })
    assert.equal(errors.length, 3)
  })
})
