import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// `rotulo` é o município já escolhido, exibido no lugar do placeholder.
export function BuscaMunicipio({
  uf, placeholder, rotulo, ignorar, aoEscolher, grande = false, className = '', children,
}) {
  const [busca, setBusca]         = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [aberto, setAberto]       = useState(false)
  const debounceRef = useRef(null)

  // Autocomplete com debounce
  useEffect(() => {
    const q = busca.trim()
    clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      if (q.length < 2) {
        setSugestoes([])
        setAberto(false)
        return
      }
      try {
        const params = new URLSearchParams({ q, limit: 8 })
        if (uf) params.set('uf', uf)
        const res = await axios.get(`${BASE_URL}/api/municipios?${params}`)
        setSugestoes(res.data)
        setAberto(true)
      } catch {
        setSugestoes([])
      }
    }, q.length < 2 ? 0 : 300)

    return () => clearTimeout(debounceRef.current)
  }, [busca, uf])

  function escolher(m) {
    aoEscolher(m)
    setBusca('')
    setSugestoes([])
    setAberto(false)
  }

  const visiveis = sugestoes.filter(m => m.id !== ignorar)

  return (
    <div className="relative">
      <input
        type="text"
        value={busca}
        placeholder={rotulo ?? placeholder}
        onChange={e => setBusca(e.target.value)}
        onFocus={() => visiveis.length > 0 && setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        className={`rounded-lg border border-gray-300 dark:border-gray-600
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${grande ? 'px-3 py-2.5 text-base font-medium' : 'px-3 py-1.5 text-sm'}
                    ${rotulo
                      ? 'placeholder-gray-900 dark:placeholder-gray-100'
                      : 'placeholder-gray-400 dark:placeholder-gray-500'}
                    ${className}`}
      />
      {children}
      {aberto && visiveis.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-64 overflow-auto
                       rounded-lg shadow-lg border
                       bg-white border-gray-200
                       dark:bg-gray-800 dark:border-gray-600">
          {visiveis.map(m => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={() => escolher(m)}
                className="w-full text-left px-3 py-2 text-sm
                           text-gray-800 dark:text-gray-200
                           hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                {m.nome} <span className="text-gray-400">– {m.uf === 'ZZ' ? 'Exterior' : m.uf}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
