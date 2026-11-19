import { useEffect, useState } from 'react'

export function useRota() {
  const [rota, setRota] = useState(window.location.pathname)

  useEffect(() => {
    const aoNavegar = () => setRota(window.location.pathname)
    window.addEventListener('popstate', aoNavegar)
    return () => window.removeEventListener('popstate', aoNavegar)
  }, [])

  // A querystring acompanha a troca de tela: a seleção feita no painel
  // continua na URL e está lá ao voltar.
  function navegar(caminho) {
    if (caminho === rota) return
    window.history.pushState({}, '', caminho + window.location.search)
    setRota(caminho)
  }

  return [rota, navegar]
}
