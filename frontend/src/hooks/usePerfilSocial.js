import { useMemo } from 'react'
import { useApi } from './useApi'

// Sem base (perfil social ainda não carregado), o indicador fica vazio em vez de 0%.
const pct = (parte, total) => (total > 0 ? (parte / total) * 100 : null)

function montarPerfilSocial(s) {
  const declarados = s.racaCor.filter(r => r.codigo !== '-1')
  const totalDeclarados = declarados.reduce((acc, r) => acc + r.total, 0)
  const casados = s.estadoCivil.find(e => e.codigo === '3')?.total ?? 0

  return {
    total:          s.total,
    estadoCivil:    s.estadoCivil.filter(e => e.codigo !== '0'),
    racaCor:        declarados,
    declarados:     totalDeclarados,
    casados:        pct(casados, s.total),
    declararamRaca: pct(totalDeclarados, s.total),
    quilombolas:    pct(s.quilombola.S, s.quilombola.S + s.quilombola.N),
    deficiencia:    pct(s.comDeficiencia, s.total),
    nomeSocial:     pct(s.comNomeSocial, s.total),
    biometria:      pct(s.comBiometria, s.total),
  }
}

export function usePerfilSocial(id) {
  const { data, loading, error } = useApi('/api/perfil-social', { municipioId: id })
  const perfil = useMemo(() => (data ? montarPerfilSocial(data) : null), [data])

  return { perfil: loading ? null : perfil, loading, error }
}
