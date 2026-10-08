import { useEffect, useState } from 'react'

function ler(nome, padrao, valores) {
  const v = new URLSearchParams(window.location.search).get(nome)
  return valores.includes(v) ? v : padrao
}

/**
 * Preferência de visualização refletida na querystring, para que o link
 * compartilhado reproduza também como a tabela estava ordenada.
 *
 * Grava com replaceState: ordenar refina a visão, não navega — o botão voltar
 * continua respondendo às mudanças de filtro, que são o que o usuário espera
 * desfazer. O valor padrão é omitido da URL, mantendo-a curta.
 */
export function useParametroUrl(nome, padrao, valores) {
  const [valor, setValor] = useState(() => ler(nome, padrao, valores))

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (valor === padrao) p.delete(nome)
    else                  p.set(nome, valor)

    const qs = p.toString()
    window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname)
  }, [nome, valor, padrao])

  useEffect(() => {
    const aoNavegar = () => setValor(ler(nome, padrao, valores))
    window.addEventListener('popstate', aoNavegar)
    return () => window.removeEventListener('popstate', aoNavegar)
  })

  return [valor, setValor]
}
