import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function lerId(p, nome) {
  const n = Number(p.get(nome))
  return Number.isInteger(n) && n > 0 ? n : null
}

// Sem comparação na URL, o município selecionado no painel entra como A. Com B
// presente, A vazio foi escolha do usuário e não é preenchido de novo.
function lerUrl() {
  const p = new URLSearchParams(window.location.search)
  const a = lerId(p, 'a') ?? (p.has('b') ? null : lerId(p, 'municipioId'))
  const b = lerId(p, 'b')

  return {
    a: a ? { id: a } : null,
    b: b && b !== a ? { id: b } : null,
  }
}

function escreverUrl({ a, b }, metodo) {
  const p = new URLSearchParams(window.location.search)

  for (const [chave, id] of Object.entries({ a, b })) {
    if (id) p.set(chave, id)
    else    p.delete(chave)
  }

  const qs = p.toString()
  window.history[metodo]({}, '', qs ? `?${qs}` : window.location.pathname)
}

const chave = (idA, idB) => `${idA ?? ''}-${idB ?? ''}`

function buscarMunicipio(id) {
  return axios
    .get(`${BASE_URL}/api/municipios`, { params: { municipioId: id } })
    .then(res => res.data?.[0] ?? null)
    .catch(() => null)
}

// Par A/B na URL (?a=&b=), com o mesmo tratamento de histórico dos filtros do painel.
export function useComparacao() {
  const [par, setPar] = useState(lerUrl)

  const vindoDaUrl = useRef(true)
  const naUrl      = useRef(null)

  const idA = par.a?.id ?? null
  const idB = par.b?.id ?? null

  // A URL guarda só os ids; nome e UF vêm da API.
  useEffect(() => {
    let cancelado = false

    for (const lado of ['a', 'b']) {
      const m = par[lado]
      if (!m || m.nome) continue

      buscarMunicipio(m.id).then(achado => {
        if (cancelado) return
        if (!achado) vindoDaUrl.current = true    // id inexistente: a URL se limpa
        setPar(p => (p[lado]?.id === m.id ? { ...p, [lado]: achado } : p))
      })
    }

    return () => { cancelado = true }
  }, [par])

  useEffect(() => {
    function aoNavegar() {
      const alvo = lerUrl()
      if (chave(alvo.a?.id, alvo.b?.id) === naUrl.current) return
      vindoDaUrl.current = true
      setPar(alvo)
    }

    window.addEventListener('popstate', aoNavegar)
    return () => window.removeEventListener('popstate', aoNavegar)
  }, [])

  useEffect(() => {
    const metodo = vindoDaUrl.current ? 'replaceState' : 'pushState'
    vindoDaUrl.current = false
    naUrl.current = chave(idA, idB)
    escreverUrl({ a: idA, b: idB }, metodo)
  }, [idA, idB])

  return {
    a: par.a,
    b: par.b,
    escolher: (lado, m) => setPar(p => ({ ...p, [lado]: m })),
    trocar:   () => setPar(p => ({ a: p.b, b: p.a })),
  }
}
