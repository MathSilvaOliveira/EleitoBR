import { useMemo } from 'react'
import { useApi } from './useApi'
import {
  abreviaEscolaridade, agruparFaixasPiramide, bucketFaixa,
  limitesFaixa, BUCKETS_COMPARACAO_ROTULOS,
} from '../utils/formatos'
import { idadeMediana } from '../utils/estatisticas'

const pct = (parte, total) => (total > 0 ? (parte / total) * 100 : 0)

const GERACOES = [
  { rotulo: 'até 24 anos',  de: 0,  ate: 24 },
  { rotulo: '25 a 44 anos', de: 25, ate: 44 },
  { rotulo: '45 a 59 anos', de: 45, ate: 59 },
  { rotulo: '60 ou mais',   de: 60, ate: Infinity },
]

function cruzarEscolaridadeIdade({ escolaridades, celulas }) {
  const linhas = escolaridades
    .filter(e => e.codigo !== '0')
    .map(e => ({
      codigo:  e.codigo,
      rotulo:  abreviaEscolaridade(e.descricao),
      somas:   Object.fromEntries(BUCKETS_COMPARACAO_ROTULOS.map(b => [b, 0])),
    }))
  const porCodigo = new Map(linhas.map(l => [l.codigo, l]))

  let total = 0
  for (const c of celulas) {
    const faixa = bucketFaixa(c.faixa, true)
    const linha = porCodigo.get(c.escolaridade)
    if (!faixa || !linha) continue
    linha.somas[faixa] += c.total
    total += c.total
  }

  return linhas.map(l => ({
    codigo:  l.codigo,
    rotulo:  l.rotulo,
    celulas: BUCKETS_COMPARACAO_ROTULOS.map(faixa => ({
      faixa,
      total: l.somas[faixa],
      pct:   pct(l.somas[faixa], total),
    })),
  }))
}

function cruzarEscolaridadeGenero(linhas) {
  const totalM = linhas.reduce((acc, l) => acc + l.M, 0)
  const totalF = linhas.reduce((acc, l) => acc + l.F, 0)

  return linhas
    .filter(l => l.codigo !== '0')
    .map(l => ({
      codigo: l.codigo,
      rotulo: abreviaEscolaridade(l.descricao),
      M:      pct(l.M, totalM),
      F:      pct(l.F, totalF),
    }))
}

function montarPerfil(faixas, escolaridades, indicadores, escolaridadeFaixa, escolaridadeGenero) {
  const total = faixas.reduce((soma, f) => soma + f.total, 0)
  const soma  = g => faixas.reduce((acc, f) => acc + f[g], 0)

  const generos   = ['F', 'M', 'NI'].map(g => ({ genero: g, total: soma(g) }))
  const niveis    = escolaridades.filter(e => e.codigo !== '0')
  const somaNivel = codigos => niveis
    .filter(e => codigos.includes(e.codigo))
    .reduce((acc, e) => acc + e.total, 0)

  const validas    = faixas.filter(f => Number(f.codigo) > 0)
  const comIdade   = validas.reduce((acc, f) => acc + f.total, 0)
  const somaIdades = teste => validas
    .filter(f => teste(limitesFaixa(f.codigo).inicio))
    .reduce((acc, f) => acc + f.total, 0)

  const geracoes = GERACOES.map(g => ({
    rotulo: g.rotulo,
    total:  somaIdades(idade => idade >= g.de && idade <= g.ate),
  }))
  const piramide = agruparFaixasPiramide(faixas)
  const tamanho  = f => f.M + f.F + f.NI

  return {
    total,
    comIdade,
    generos,
    mulheres:     pct(generos[0].total, total),
    mediana:      idadeMediana(faixas),
    superior:     pct(somaNivel(['8']), total),
    iee:          indicadores[0]?.iee   ?? null,
    hiato:        indicadores[0]?.hiato ?? null,
    piramide,
    geracoes,
    jovens:       pct(geracoes[0].total, comIdade),
    idosos:       pct(geracoes[3].total, comIdade),
    facultativo:  pct(somaIdades(idade => idade <= 17 || idade >= 70), comIdade),
    faixaMaior:   piramide.reduce((maior, f) => (tamanho(f) > tamanho(maior) ? f : maior)).descricao,
    escolaridade: niveis,
    baixa:        indicadores[0]?.pct_baixa_instrucao ?? null,
    medioOuMais:  pct(somaNivel(['6', '7', '8']), total),
    analfabetos:  pct(somaNivel(['1']), total),
    nivelComum:   abreviaEscolaridade(niveis.reduce((maior, e) => (e.total > maior.total ? e : maior)).descricao),
    escolaridadeIdade:  cruzarEscolaridadeIdade(escolaridadeFaixa),
    escolaridadeGenero: cruzarEscolaridadeGenero(escolaridadeGenero),
  }
}

export function usePerfilMunicipio(id) {
  const faixas             = useApi('/api/cruzamentos/genero-faixa', { municipioId: id })
  const escolaridade       = useApi('/api/escolaridade', { municipioId: id })
  const indicadores        = useApi('/api/indicadores/municipios', { municipioId: id, limit: 1 })
  const escolaridadeFaixa  = useApi('/api/cruzamentos/escolaridade-faixa', { municipioId: id })
  const escolaridadeGenero = useApi('/api/cruzamentos/escolaridade-genero', { municipioId: id })

  const consultas = [faixas, escolaridade, indicadores, escolaridadeFaixa, escolaridadeGenero]
  const loading   = consultas.some(c => c.loading)
  const error     = consultas.find(c => c.error)?.error ?? null

  const perfil = useMemo(() => {
    if (!faixas.data || !escolaridade.data || !indicadores.data
        || !escolaridadeFaixa.data || !escolaridadeGenero.data) return null
    return montarPerfil(
      faixas.data, escolaridade.data, indicadores.data,
      escolaridadeFaixa.data, escolaridadeGenero.data,
    )
  }, [faixas.data, escolaridade.data, indicadores.data, escolaridadeFaixa.data, escolaridadeGenero.data])

  return { perfil: loading ? null : perfil, loading, error }
}
