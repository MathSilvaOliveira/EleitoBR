import { useMemo } from 'react'
import { useApi } from './useApi'
import { agruparFaixasPiramide } from '../utils/formatos'
import { idadeMediana } from '../utils/estatisticas'

const pct = (parte, total) => (total > 0 ? (parte / total) * 100 : 0)

function montarPerfil(faixas, escolaridades, indicadores) {
  const total = faixas.reduce((soma, f) => soma + f.total, 0)
  const soma  = g => faixas.reduce((acc, f) => acc + f[g], 0)

  const generos  = ['F', 'M', 'NI'].map(g => ({ genero: g, total: soma(g) }))
  const superior = escolaridades.find(e => e.codigo === '8')?.total ?? 0

  return {
    total,
    generos,
    mulheres:     pct(generos[0].total, total),
    mediana:      idadeMediana(faixas),
    superior:     pct(superior, total),
    iee:          indicadores[0]?.iee   ?? null,
    hiato:        indicadores[0]?.hiato ?? null,
    piramide:     agruparFaixasPiramide(faixas),
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
