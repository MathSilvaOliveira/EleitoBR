import { useCallback, useMemo, useState } from 'react'
import { FiltrosContext } from './FiltrosContext'
import { GENERO_ROTULO } from '../utils/formatos'

export function FiltrosProvider({ children }) {
  const [uf, setUfState]               = useState(null)
  const [municipio, setMunicipioState] = useState(null)
  const [genero, setGenero]            = useState(null)

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
    setGenero(null)
  }, [])

  const value = useMemo(() => {
    // Recorte só geográfico. Os gráficos que têm gênero como eixo próprio
    // consomem este, para não se filtrarem a si mesmos.
    const apiParamsSemGenero = {
      uf:          municipio ? null : uf,
      municipioId: municipio?.id ?? null,
    }

    const rotuloLocal = municipio
      ? `${municipio.nome} – ${municipio.uf}`
      : uf === 'ZZ' ? 'Exterior (ZZ)'
      : uf ?? 'Brasil'

    return {
      uf,
      municipio,
      genero,
      setUf,
      setMunicipio,
      setGenero,
      limpar,
      apiParamsSemGenero,
      apiParams: { ...apiParamsSemGenero, genero },
      rotuloLocal,
      rotulo: genero ? `${rotuloLocal} · ${GENERO_ROTULO[genero]}` : rotuloLocal,
    }
  }, [uf, municipio, genero, setUf, setMunicipio, limpar])

  return (
    <FiltrosContext.Provider value={value}>
      {children}
    </FiltrosContext.Provider>
  )
}
