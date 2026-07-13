import { useApi }     from '../hooks/useApi'
import { useFiltros } from '../context/FiltrosContext'
import { useTema }    from '../context/TemaContext'
import { Skeleton, ErroCarga, InfoTooltip } from './ui/Primitivas'
import { numeroPtBR, numeroCompacto } from '../utils/formatos'

const INFO = `O TSE registra os eleitores residentes fora do Brasil sob o código ZZ. ` +
  `Cada cidade estrangeira com seção eleitoral (em geral, sedes de embaixadas e ` +
  `consulados) é cadastrada como uma "localidade". Estes eleitores votam apenas ` +
  `para Presidente da República.`

export function ExteriorPanel() {
  const { setUf, uf }            = useFiltros()
  const { paleta }               = useTema()
  const { data, loading, error } = useApi('/api/exterior', { limit: 8 })

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="chart-title">🌍 Eleitorado no Exterior</p>
          <p className="chart-subtitle">
            Brasileiros aptos a votar fora do país, por localidade de alistamento
          </p>
        </div>
        <InfoTooltip texto={INFO} />
      </div>

      {error   ? <ErroCarga mensagem={error} altura={280} />
       : loading ? <Skeleton altura={280} />
       : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Total + gênero */}
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                {numeroPtBR(data.total)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                eleitores no exterior
              </p>
            </div>

            <div className="space-y-1.5">
              {data.generos.map(g => {
                const pct = data.total > 0 ? (g.total / data.total) * 100 : 0
                const rotulo = { F: 'Feminino', M: 'Masculino', NI: 'Não inf.' }[g.genero]
                const cor = {
                  F: paleta.feminino, M: paleta.masculino, NI: paleta.naoInf,
                }[g.genero]
                return (
                  <div key={g.genero} className="text-xs">
                    <div className="flex justify-between mb-0.5
                                    text-gray-600 dark:text-gray-300">
                      <span>{rotulo}</span>
                      <span className="tabular-nums">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded bg-gray-100 dark:bg-gray-700">
                      <div className="h-full rounded"
                           style={{ width: `${pct}%`, backgroundColor: cor }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => setUf(uf === 'ZZ' ? null : 'ZZ')}
              className="text-sm px-4 py-2 rounded-lg font-medium
                         bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {uf === 'ZZ' ? 'Voltar ao Brasil' : 'Analisar exterior em detalhe →'}
            </button>
          </div>

          {/* Top localidades */}
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-wide mb-3
                          text-gray-500 dark:text-gray-400">
              Maiores localidades
            </p>
            <div className="space-y-2">
              {data.localidades.map(l => {
                const maior = data.localidades[0]?.total ?? 1
                return (
                  <div key={l.id} className="flex items-center gap-3 text-sm">
                    <span className="w-44 truncate text-gray-700 dark:text-gray-300"
                          title={l.nome}>
                      {l.nome}
                    </span>
                    <div className="flex-1 h-4 rounded bg-gray-100 dark:bg-gray-700">
                      <div
                        className="h-full rounded bg-gradient-to-r
                                   from-blue-500 to-violet-500"
                        style={{ width: `${(l.total / maior) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-right tabular-nums
                                     text-gray-600 dark:text-gray-400">
                      {numeroCompacto(l.total)}
                      <span className="text-xs text-gray-400 ml-1">({l.pct}%)</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
