import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useFiltros } from '../context/FiltrosContext'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function FilterBar({ ufs = [] }) {
  const { uf, municipio, setUf, setMunicipio, limpar, rotulo } = useFiltros()

  const [busca, setBusca]           = useState('')
  const [sugestoes, setSugestoes]   = useState([])
  const [aberto, setAberto]         = useState(false)
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
    setMunicipio(m)
    setBusca('')
    setSugestoes([])
    setAberto(false)
  }

  return (
    <div className="card !p-4 flex flex-wrap items-center gap-3">

      {/* Seleção ativa */}
      <div className="flex items-center gap-2 mr-auto">
        <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Seleção
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {rotulo}
        </span>
        {(uf || municipio) && (
          <button
            onClick={limpar}
            className="text-xs px-2 py-0.5 rounded-full
                       bg-gray-200 hover:bg-gray-300 text-gray-700
                       dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          >
            ✕ limpar
          </button>
        )}
      </div>

      {/* UF */}
      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        UF
        <select
          value={uf ?? ''}
          onChange={e => setUf(e.target.value || null)}
          className="rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     px-3 py-1.5 text-sm focus:outline-none focus:ring-2
                     focus:ring-blue-500"
        >
          <option value="">Brasil (todas)</option>
          {ufs.map(u => (
            <option key={u.uf} value={u.uf}>{u.uf}</option>
          ))}
          <option value="ZZ">Exterior</option>
        </select>
      </label>

      {/* Município */}
      <div className="relative">
        <input
          type="text"
          value={busca}
          placeholder={
            municipio
              ? municipio.nome
              : uf === 'ZZ' ? 'Buscar localidade…' : 'Buscar município…'
          }
          onChange={e => setBusca(e.target.value)}
          onFocus={() => sugestoes.length > 0 && setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 150)}
          className="w-56 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     px-3 py-1.5 text-sm focus:outline-none focus:ring-2
                     focus:ring-blue-500"
        />
        {aberto && sugestoes.length > 0 && (
          <ul className="absolute z-30 mt-1 w-full max-h-64 overflow-auto
                         rounded-lg shadow-lg border
                         bg-white border-gray-200
                         dark:bg-gray-800 dark:border-gray-600">
            {sugestoes.map(m => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={() => escolher(m)}
                  className="w-full text-left px-3 py-2 text-sm
                             text-gray-800 dark:text-gray-200
                             hover:bg-blue-50 dark:hover:bg-gray-700"
                >
                  {m.nome} <span className="text-gray-400">– {m.uf}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
