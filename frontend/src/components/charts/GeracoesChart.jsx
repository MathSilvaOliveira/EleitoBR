import { useTema } from '../../context/TemaContext'
import { decimalPtBR, percentualPtBR } from '../../utils/formatos'

const OPACIDADES = [0.3, 0.55, 0.8, 1]

export function GeracoesChart({ geracoes, mediana }) {
  const { paleta, tema } = useTema()

  const total      = geracoes.reduce((soma, g) => soma + g.total, 0)
  const cor        = i => `rgba(${paleta.sequencialRgb}, ${OPACIDADES[i]})`
  const textoClaro = i => (tema === 'dark' ? i < 2 : i === OPACIDADES.length - 1)

  return (
    <div>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-50">{decimalPtBR(mediana)}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">anos · idade mediana</p>

      <div className="mt-4 flex h-8 gap-0.5 rounded overflow-hidden">
        {geracoes.map((g, i) => {
          const pct = total > 0 ? (g.total / total) * 100 : 0
          return (
            <div
              key={g.rotulo}
              title={`${g.rotulo}: ${percentualPtBR(pct)}`}
              className={`min-w-0 flex items-center justify-center text-[11px] font-semibold
                          tabular-nums ${textoClaro(i) ? 'text-white' : 'text-gray-900'}`}
              style={{ flexGrow: pct, flexBasis: 0, backgroundColor: cor(i) }}
            >
              {pct >= 8 && percentualPtBR(pct)}
            </div>
          )
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        {geracoes.map((g, i) => (
          <li key={g.rotulo} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cor(i) }} />
            {g.rotulo}
          </li>
        ))}
      </ul>
    </div>
  )
}
