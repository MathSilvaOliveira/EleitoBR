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

  it('devolve só o município pedido por id, sem o corte de minEleitores', async () => {
    const linhas = await cruzamentos.getIndicadoresMunicipios({ municipioId: municipios.gama.id })
    assert.equal(linhas.length, 1)
    assert.equal(linhas[0].nome,  'GAMA')
    assert.equal(linhas[0].total, 500)
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

  it('inverte a ordem quando a direção é asc', async () => {
    assert.deepEqual(nomes(await cruzamentos.getIndicadoresMunicipios({ ...opcoes, orderBy: 'total', direcao: 'asc' })),
      ['GAMA', 'ALFA', 'BETA'])
  })

  // O município sem jovens tem IEE nulo. Em ordem crescente ele seria o
  // primeiro se os nulos não fossem empurrados para o fim.
  it('mantém os nulos no fim também na ordem crescente', async () => {
    assert.deepEqual(nomes(await cruzamentos.getIndicadoresMunicipios({ ...opcoes, orderBy: 'iee', direcao: 'asc' })),
      ['BETA', 'ALFA', 'GAMA'])
  })

  it('usa decrescente quando a direção é desconhecida', async () => {
    const invalida = await cruzamentos.getIndicadoresMunicipios({ ...opcoes, orderBy: 'total', direcao: 'DROP TABLE' })
    assert.deepEqual(nomes(invalida), ['BETA', 'ALFA', 'GAMA'])
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

describe('procedência dos dados', () => {
  it('devolve null quando nenhuma carga foi registrada', async () => {
    assert.equal(await eleitorado.getImportacao(), null)
  })

  it('devolve a carga mais recente, com bytes serializável em JSON', async () => {
    await prisma.importacao.createMany({
      data: [
        { arquivo: 'antigo.csv', bytes: 100n, sha256: 'aaa', baixadoEm: new Date('2026-01-01'),
          carregadoEm: new Date('2026-01-02'), linhasLidas: 1, registrosGravados: 1, municipios: 1 },
        { arquivo: 'novo.csv',   bytes: 2285954062n, sha256: 'bbb', baixadoEm: new Date('2026-05-24'),
          carregadoEm: new Date('2026-05-25'), linhasLidas: 2, registrosGravados: 2, municipios: 2 },
      ],
    })

    const r = await eleitorado.getImportacao()
    assert.equal(r.arquivo, 'novo.csv')
    assert.equal(r.sha256, 'bbb')

    // bytes é BigInt no banco; precisa sair como Number ou o JSON.stringify quebra.
    assert.equal(typeof r.bytes, 'number')
    assert.equal(r.bytes, 2285954062)
    assert.doesNotThrow(() => JSON.stringify(r))
  })
})

// A tela guarda só o id do município na URL; reconstruir o rótulo ao abrir o
// link depende desta busca.
describe('busca de município por id', () => {
  it('devolve o município pedido', async () => {
    const r = await eleitorado.getMunicipios({ municipioId: municipios.alfa.id })
    assert.equal(r.length, 1)
    assert.equal(r[0].nome, 'ALFA')
    assert.equal(r[0].uf, 'SP')
  })

  it('alcança localidade do exterior, que a busca por nome exclui', async () => {
    const r = await eleitorado.getMunicipios({ municipioId: municipios.lisboa.id })
    assert.equal(r[0].nome, 'LISBOA')
    assert.equal(r[0].uf, 'ZZ')
  })

  it('devolve vazio para id inexistente, em vez de erro', async () => {
    assert.deepEqual(await eleitorado.getMunicipios({ municipioId: 999999 }), [])
  })

  it('sem id, segue excluindo o exterior da busca por nome', async () => {
    const nomes = (await eleitorado.getMunicipios({})).map(m => m.nome)
    assert.ok(!nomes.includes('LISBOA'))
  })
})
