import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'

import prisma            from '../src/lib/prisma.js'
import { seed, ESPERADO } from './seed.js'
import * as eleitorado    from '../src/services/eleitoradoService.js'
import * as cruzamentos   from '../src/services/cruzamentoService.js'

let municipios

before(async () => { municipios = await seed() })
after(async () => { await prisma.$disconnect() })

describe('exterior (ZZ)', () => {
  it('fica fora dos agregados nacionais', async () => {
    const r = await eleitorado.getResumo()
    assert.equal(r.total_brasil,     ESPERADO.totalBrasil)
    assert.equal(r.total_exterior,   ESPERADO.totalExterior)
    assert.equal(r.total_municipios, ESPERADO.totalMunicipios)
    assert.equal(r.total_estados,    ESPERADO.totalEstados)
  })

  it('é consultável quando pedido explicitamente com uf=ZZ', async () => {
    const r = await eleitorado.getResumo({ uf: 'ZZ' })
    assert.equal(r.total_selecao, ESPERADO.totalExterior)
  })

  it('não aparece no total por UF', async () => {
    const ufs = (await eleitorado.getRegioes()).map(r => r.uf)
    assert.deepEqual(ufs.sort(), ['RJ', 'SP'])
  })

  it('tem painel próprio com o total correto', async () => {
    const ext = await cruzamentos.getExterior()
    assert.equal(ext.total, ESPERADO.totalExterior)
  })
})

describe('composição de filtros', () => {
  it('sem filtro não produz seleção', async () => {
    assert.equal((await eleitorado.getResumo()).total_selecao, null)
  })

  it('filtra por uf', async () => {
    assert.equal((await eleitorado.getResumo({ uf: 'SP' })).total_selecao, ESPERADO.spTotal)
  })

  it('filtra por gênero', async () => {
    assert.equal((await eleitorado.getResumo({ genero: 'F' })).total_selecao, ESPERADO.brasilF)
  })

  it('combina uf e gênero', async () => {
    const r = await eleitorado.getResumo({ uf: 'SP', genero: 'F' })
    assert.equal(r.total_selecao, ESPERADO.spF)
  })

  it('combina município e gênero', async () => {
    const r = await eleitorado.getResumo({ municipioId: municipios.alfa.id, genero: 'F' })
    assert.equal(r.total_selecao, 500)
  })

  it('aplica gênero ao total por UF', async () => {
    const r = await eleitorado.getRegioes({ genero: 'F' })
    assert.equal(r.find(x => x.uf === 'SP').total, ESPERADO.spF)
    assert.equal(r.find(x => x.uf === 'RJ').total, ESPERADO.rjF)
  })

  it('distribui por gênero sem contar o exterior', async () => {
    const g = await eleitorado.getGenero()
    assert.equal(g.find(x => x.genero === 'F').total, ESPERADO.brasilF)
    assert.equal(g.find(x => x.genero === 'M').total, ESPERADO.brasilM)
  })
})

describe('indicadores IEE e Hiato', () => {
  const opcoes = { minEleitores: 0 }

  it('calcula IEE e Hiato conferidos à mão', async () => {
    const linhas = await cruzamentos.getIndicadoresMunicipios(opcoes)
    const por = Object.fromEntries(linhas.map(l => [l.nome, l]))

    // ALFA: idosos 600 / jovens 200 = 3.00 | (baixa 200 - sup 600) / 1000 = -40.0 p.p.
    assert.equal(por.ALFA.iee,   3)
    assert.equal(por.ALFA.hiato, -40)

    // BETA: idosos 400 / jovens 800 = 0.50 | (baixa 1200 - sup 800) / 2000 = +20.0 p.p.
    assert.equal(por.BETA.iee,   0.5)
    assert.equal(por.BETA.hiato, 20)
  })

  it('devolve IEE nulo quando o município não tem jovens, em vez de estourar', async () => {
    const linhas = await cruzamentos.getIndicadoresMunicipios(opcoes)
    const gama = linhas.find(l => l.nome === 'GAMA')
    assert.equal(gama.iee,   null)
    assert.equal(gama.hiato, 0)
  })

  it('ignora o exterior no ranking', async () => {
    const nomes = (await cruzamentos.getIndicadoresMunicipios(opcoes)).map(l => l.nome)
    assert.ok(!nomes.includes('LISBOA'))
  })

  it('respeita o corte de minEleitores', async () => {
    const nomes = (await cruzamentos.getIndicadoresMunicipios({ minEleitores: 1500 })).map(l => l.nome)
    assert.deepEqual(nomes, ['BETA'])
  })

  it('aplica o filtro de gênero aos indicadores', async () => {
    const linhas = await cruzamentos.getIndicadoresMunicipios({ ...opcoes, genero: 'F' })
    const alfa = linhas.find(l => l.nome === 'ALFA')
    assert.equal(alfa.total, 500)
    assert.equal(alfa.iee,   3)
  })
})

// Regressão: orderBy=iee e orderBy=hiato apontavam para colunas inexistentes
// no SELECT e devolviam 500 (Postgres 42703).
describe('ordenação do ranking', () => {
  const opcoes = { minEleitores: 0 }
  const nomes  = linhas => linhas.map(l => l.nome)

  it('ordena por total', async () => {
    assert.deepEqual(nomes(await cruzamentos.getIndicadoresMunicipios({ ...opcoes, orderBy: 'total' })),
      ['BETA', 'ALFA', 'GAMA'])
  })

  it('ordena por IEE com nulos no fim', async () => {
    assert.deepEqual(nomes(await cruzamentos.getIndicadoresMunicipios({ ...opcoes, orderBy: 'iee' })),
      ['ALFA', 'BETA', 'GAMA'])
  })

  it('ordena por Hiato', async () => {
    assert.deepEqual(nomes(await cruzamentos.getIndicadoresMunicipios({ ...opcoes, orderBy: 'hiato' })),
      ['BETA', 'GAMA', 'ALFA'])
  })
})

describe('cruzamento gênero × faixa etária', () => {
  it('soma por faixa e devolve as faixas em ordem crescente', async () => {
    const linhas = await cruzamentos.getGeneroPorFaixa()
    assert.deepEqual(linhas.map(l => l.codigo), ['1800', '3034', '6064'])

    const jovem = linhas.find(l => l.codigo === '1800')
    assert.equal(jovem.M, 500)
    assert.equal(jovem.F, 500)
    assert.equal(jovem.total, 1000)

    const soma = linhas.reduce((acc, l) => acc + l.total, 0)
    assert.equal(soma, ESPERADO.totalBrasil)
  })
})
