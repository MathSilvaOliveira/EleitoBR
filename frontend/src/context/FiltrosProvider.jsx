import { useCallback, useMemo, useState } from 'react'
import { FiltrosContext } from './FiltrosContext'

export function FiltrosProvider({ children }) {
  const [uf, setUfState]               = useState(null)
  const [municipio, setMunicipioState] = useState(null)

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
      : uf === 'ZZ' ? 'Exterior'
      : uf ?? 'Brasil',
  }), [uf, municipio, setUf, setMunicipio, limpar])

  return (
    <FiltrosContext.Provider value={value}>
      {children}
    </FiltrosContext.Provider>
  )
}