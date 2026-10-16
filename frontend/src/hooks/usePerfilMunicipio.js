import { useMemo } from 'react'
import { useApi } from './useApi'
import { agruparFaixasPiramide, limitesFaixa } from '../utils/formatos'
import { idadeMediana } from '../utils/estatisticas'

const pct = (parte, total) => (total > 0 ? (parte / total) * 100 : 0)

const GERACOES = [
  { rotulo: 'até 24 anos',  de: 0,  ate: 24 },
  { rotulo: '25 a 44 anos', de: 25, ate: 44 },
  { rotulo: '45 a 59 anos', de: 45, ate: 59 },
  { rotulo: '60 ou mais',   de: 60, ate: Infinity },
]

function montarPerfil(faixas, escolaridades, indicadores) {
  const total = faixas.reduce((soma, f) => soma + f.total, 0)
  const soma  = g => faixas.reduce((acc, f) => acc + f[g], 0)

  const generos  = ['F', 'M', 'NI'].map(g => ({ genero: g, total: soma(g) }))
  const superior = escolaridades.find(e => e.codigo === '8')?.total ?? 0

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
    superior:     pct(superior, total),
    iee:          indicadores[0]?.iee   ?? null,
    hiato:        indicadores[0]?.hiato ?? null,
    piramide,
    geracoes,
    jovens:       pct(geracoes[0].total, comIdade),
    idosos:       pct(geracoes[3].total, comIdade),
    facultativo:  pct(somaIdades(idade => idade <= 17 || idade >= 70), comIdade),
    faixaMaior:   piramide.reduce((maior, f) => (tamanho(f) > tamanho(maior) ? f : maior)).descricao,
    escolaridade: escolaridades.filter(e => e.codigo !== '0'),
  }
}

export function usePerfilMunicipio(id) {
  const faixas       = useApi('/api/cruzamentos/genero-faixa', { municipioId: id })
  const escolaridade = useApi('/api/escolaridade', { municipioId: id })
  const indicadores  = useApi('/api/indicadores/municipios', { municipioId: id, limit: 1 })

  const loading = faixas.loading || escolaridade.loading || indicadores.loading
  const error   = faixas.error ?? escolaridade.error ?? indicadores.error

  const perfil = useMemo(() => {
    if (!faixas.data || !escolaridade.data || !indicadores.data) return null
    return montarPerfil(faixas.data, escolaridade.data, indicadores.data)
  }, [faixas.data, escolaridade.data, indicadores.data])

  return { perfil: loading ? null : perfil, loading, error }
}
