import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { FiltrosContext } from './FiltrosContext'
import { GENERO_ROTULO } from '../utils/formatos'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const GENEROS  = Object.keys(GENERO_ROTULO)

/**
 * A seleção vive na querystring para que uma visão específica possa ser
 * compartilhada, citada e alcançada pelo botão voltar do navegador. Os nomes
 * dos parâmetros são os mesmos da API (uf, municipioId, genero), de modo que a
 * URL da tela possa ser lida junto com a da API sem tradução.
 */
function lerUrl() {
  const p  = new URLSearchParams(window.location.search)
  const uf = p.get('uf')?.trim().toUpperCase() || null
  const id = Number(p.get('municipioId'))
  const g  = p.get('genero')?.trim().toUpperCase() || null

  return {
    uf:          uf && /^[A-Z]{2}$/.test(uf) ? uf : null,
    municipioId: Number.isInteger(id) && id > 0 ? id : null,
    genero:      GENEROS.includes(g) ? g : null,
  }
}

// A UF é gravada junto com o município de propósito: evita a tela piscar em
// "Brasil" enquanto o nome do município é buscado, e mantém a visão utilizável
// caso essa busca falhe.
function escreverUrl({ uf, municipioId, genero }, metodo) {
  // Parte da querystring atual em vez de montar do zero: outros componentes
  // guardam preferências ali (a ordenação do ranking, por exemplo) e não
  // podem ser apagados a cada mudança de filtro.
  const p = new URLSearchParams(window.location.search)

  for (const [chave, valor] of Object.entries({ uf, municipioId, genero })) {
    if (valor) p.set(chave, valor)
    else       p.delete(chave)
  }

  const qs = p.toString()
  window.history[metodo]({}, '', qs ? `?${qs}` : window.location.pathname)
}

function buscarMunicipio(id) {
  return axios
    .get(`${BASE_URL}/api/municipios`, { params: { municipioId: id } })
    .then(res => res.data?.[0] ?? null)
    .catch(() => null)
}

export function FiltrosProvider({ children }) {
  const inicial = useRef(lerUrl()).current

  const [uf, setUfState]               = useState(inicial.uf)
  const [municipio, setMunicipioState] = useState(null)
  const [genero, setGenero]            = useState(inicial.genero)

  // A URL carrega só o id do município, mas o rótulo precisa do nome. Até a
  // busca responder o id fica aqui, para que a URL nunca deixe de anunciá-lo.
  const [idPendente, setIdPendente] = useState(inicial.municipioId)

  // Mudanças originadas na própria URL não devem criar entrada nova no
  // histórico — senão voltar uma vez não sai do lugar.
  const vindoDaUrl = useRef(true)

  const setUf = useCallback(u => {
    setUfState(u)
    setMunicipioState(null)
    setIdPendente(null)
  }, [])

  const setMunicipio = useCallback(m => {
    setMunicipioState(m)
    setIdPendente(null)
    if (m?.uf) setUfState(m.uf)
  }, [])

  const limpar = useCallback(() => {
    setUfState(null)
    setMunicipioState(null)
    setIdPendente(null)
    setGenero(null)
  }, [])

  useEffect(() => {
    if (!idPendente) return
    let cancelado = false

    buscarMunicipio(idPendente).then(m => {
      if (cancelado) return
      vindoDaUrl.current = true
      setMunicipioState(m)            // null quando o id não existe: a URL se limpa
      setIdPendente(null)
      if (m?.uf) setUfState(m.uf)
    })

    return () => { cancelado = true }
  }, [idPendente])

  useEffect(() => {
    function aoNavegar() {
      const alvo = lerUrl()
      vindoDaUrl.current = true
      setUfState(alvo.uf)
      setGenero(alvo.genero)
      setMunicipioState(null)
      setIdPendente(alvo.municipioId)
    }

    window.addEventListener('popstate', aoNavegar)
    return () => window.removeEventListener('popstate', aoNavegar)
  }, [])

  useEffect(() => {
    const metodo = vindoDaUrl.current ? 'replaceState' : 'pushState'
    vindoDaUrl.current = false
    escreverUrl({ uf, municipioId: municipio?.id ?? idPendente, genero }, metodo)
  }, [uf, municipio, genero, idPendente])

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
