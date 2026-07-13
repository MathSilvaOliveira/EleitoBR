import { useState } from 'react'
import { useApi }     from '../hooks/useApi'
import { useFiltros } from '../context/FiltrosContext'
import { Skeleton, ErroCarga, InfoTooltip } from './ui/Primitivas'
import { numeroPtBR } from '../utils/formatos'

const COLUNAS = [
  { chave: 'total', rotulo: 'Eleitores' },
  { chave: 'iee',   rotulo: 'IEE' },
  { chave: 'hiato', rotulo: 'Hiato (p.p.)' },
]

const INFO = `IEE (Índice de Envelhecimento Eleitoral) = eleitores 60+ ÷ eleitores 16–24; ` +
  `valores > 1 indicam mais idosos que jovens no eleitorado. ` +
  `Hiato Instrucional = %baixa instrução − %instrução superior, em pontos percentuais; ` +
  `positivo indica predomínio de baixa instrução. ` +
  `Municípios com menos de 10 mil eleitores são omitidos para evitar distorção estatística.`

export function RankingMunicipios() {
  const { uf, municipio, setMunicipio } = useFiltros()
  const [orderBy, setOrderBy] = useState('total')

  const { data, loading, error } = useApi('/api/indicadores/municipios', {
    uf: uf === 'ZZ' ? null : uf,   // indicadores não se aplicam ao exterior
    orderBy,
    limit: 15,
  })

  const linhas = data ?? []
  const max = chave => Math.max(...linhas.map(l => Math.abs(l[chave] ?? 0)), 1)
  const maximos = Object.fromEntries(COLUNAS.map(c => [c.chave, max(c.chave)]))

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="chart-title">Ranking de Municípios — Indicadores Analíticos</p>
          <p className="chart-subtitle">
            {uf && uf !== 'ZZ' ? `Municípios de ${uf}` : 'Todos os estados'} ·
            clique no cabeçalho para reordenar, na linha para filtrar
          </p>
        </div>
        <InfoTooltip texto={INFO} />
      </div>

      {error   ? <ErroCarga mensagem={error} altura={300} />
       : loading ? <Skeleton altura={300} />
       : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide
                             text-gray-500 dark:text-gray-400
                             border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 font-medium">Município</th>
                {COLUNAS.map(c => (
                  <th key={c.chave} className="py-2 pr-4 font-medium">
                    <button
                      onClick={() => setOrderBy(c.chave)}
                      className={`hover:text-blue-600 dark:hover:text-blue-400
                        ${orderBy === c.chave
                          ? 'text-blue-600 dark:text-blue-400 font-semibold'
                          : ''}`}
                    >
                      {c.rotulo} {orderBy === c.chave ? '↓' : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(l => (
                <tr
                  key={l.id}
                  onClick={() => setMunicipio(
                    municipio?.id === l.id ? null : { id: l.id, nome: l.nome, uf: l.uf },
                  )}
                  className={`cursor-pointer border-b border-gray-100
                    dark:border-gray-700/60 transition-colors
                    hover:bg-blue-50 dark:hover:bg-gray-700/50
                    ${municipio?.id === l.id
                      ? 'bg-blue-50 dark:bg-gray-700/60' : ''}`}
                >
                  <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                    {l.nome}
                    <span className="text-gray-400 text-xs ml-1">{l.uf}</span>
                  </td>
                  <CelulaBarra valor={l.total} maximo={maximos.total}
                               formato={numeroPtBR} cor="bg-blue-500" />
                  <CelulaBarra valor={l.iee} maximo={maximos.iee}
                               formato={v => v?.toFixed(2) ?? '—'} cor="bg-violet-500" />
                  <CelulaBarra valor={l.hiato} maximo={maximos.hiato}
                               formato={v => v != null ? `${v > 0 ? '+' : ''}${v.toFixed(1)}` : '—'}
                               cor={l.hiato > 0 ? 'bg-amber-500' : 'bg-emerald-500'} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CelulaBarra({ valor, maximo, formato, cor }) {
  const pct = valor != null ? Math.min(Math.abs(valor) / maximo * 100, 100) : 0

  return (
    <td className="py-2 pr-4">
      <div className="flex items-center gap-2">
        <span className="tabular-nums text-gray-700 dark:text-gray-300 w-20">
          {formato(valor)}
        </span>
        <div className="flex-1 h-1.5 rounded bg-gray-100 dark:bg-gray-700 max-w-24">
          <div className={`h-full rounded ${cor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </td>
  )
}
