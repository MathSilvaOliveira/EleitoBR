import { createContext, useContext, useMemo, useState, useCallback } from 'react'

const FiltrosContext = createContext(null)

export function FiltrosProvider({ children }) {
  const [uf, setUfState]               = useState(null)   // ex: 'SP', 'ZZ'
  const [municipio, setMunicipioState] = useState(null)   // { id, nome, uf }

  const setUf = useCallback(u => {
    setUfState(u)
    setMunicipioState(null)
  }, [])

  const setMunicipio = useCallback(m => {
    setMunicipioState(m)
    if (m?.uf) setUfState(m.uf)
  }, [])

  const limpar = useCallback(() => {
    setUfState(null)
    setMunicipioState(null)
  }, [])

  const value = useMemo(() => ({
    uf,
    municipio,
    setUf,
    setMunicipio,
    limpar,
    apiParams: {
      uf:          municipio ? null : uf,
      municipioId: municipio?.id ?? null,
    },
    rotulo: municipio
      ? `${municipio.nome} – ${municipio.uf}`
      : uf === 'ZZ' ? 'Exterior (ZZ)'
      : uf ?? 'Brasil',
  }), [uf, municipio, setUf, setMunicipio, limpar])

  return (
    <FiltrosContext.Provider value={value}>
      {children}
    </FiltrosContext.Provider>
  )
}

export function useFiltros() {
  const ctx = useContext(FiltrosContext)
  if (!ctx) throw new Error('useFiltros deve ser usado dentro de <FiltrosProvider>')
  return ctx
}
