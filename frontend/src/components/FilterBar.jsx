import { useFiltros }     from '../context/FiltrosContext'
import { BuscaMunicipio } from './BuscaMunicipio'

export function FilterBar({ ufs = [] }) {
  const { uf, municipio, genero, setUf, setMunicipio, limpar, rotulo } = useFiltros()

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
        {(uf || municipio || genero) && (
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
      <BuscaMunicipio
        uf={uf}
        placeholder={
          municipio
            ? municipio.nome
            : uf === 'ZZ' ? 'Buscar localidade…' : 'Buscar município…'
        }
        aoEscolher={setMunicipio}
        className="w-56"
      />
    </div>
  )
}
