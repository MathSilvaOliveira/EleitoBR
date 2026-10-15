import { LADOS } from './lados'
import {
  numeroPtBR, decimalPtBR, percentualPtBR, comSinal,
} from '../../utils/formatos'

const INDICADORES = [
  {
    chave: 'total', titulo: 'Eleitores',
    formato:   numeroPtBR,
    // Abaixo de 1×, percentual: "0,0×" não diz nada.
    diferenca: (v, o) => (v >= o
      ? `${decimalPtBR(v / o, v / o >= 10 ? 0 : 1)}× o outro`
      : `${percentualPtBR((v / o) * 100, v / o >= 0.1 ? 0 : 2)} do outro`),
  },
  {
    chave: 'iee', titulo: 'IEE',
    formato:   v => decimalPtBR(v, 2),
    diferenca: (v, o) => `${comSinal(v - o, 2)} vs outro`,
  },
  {
    chave: 'hiato', titulo: 'Hiato (p.p.)',
    formato:   comSinal,
    diferenca: (v, o) => `${comSinal(v - o)} p.p. vs outro`,
  },
  {
    chave: 'mulheres', titulo: 'Mulheres',
    formato:   percentualPtBR,
    diferenca: (v, o) => `${comSinal(v - o)} p.p. vs outro`,
  },
  {
    chave: 'mediana', titulo: 'Idade mediana',
    formato:   v => `${decimalPtBR(v)} anos`,
    diferenca: (v, o) => `${comSinal(v - o)} anos vs outro`,
  },
  {
    chave: 'superior', titulo: 'Superior completo',
    formato:   percentualPtBR,
    diferenca: (v, o) => `${comSinal(v - o)} p.p. vs outro`,
  },
]

// Mesmo corte do ranking de municípios.
const MIN_ELEITORES = 10_000

export function ResumoComparado({ lado, perfil, outro }) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INDICADORES.map(ind => {
          const v = perfil[ind.chave]
          const o = outro[ind.chave]
          const comparavel = v != null && o != null

          return (
            <div key={ind.chave}
                 className="rounded-lg border p-3 border-gray-200 bg-gray-50
                            dark:border-gray-700 dark:bg-gray-900/40">
              <p title={ind.titulo}
                 className="text-[11px] font-medium uppercase tracking-wide truncate
                            text-gray-500 dark:text-gray-400">
                {ind.titulo}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2">
                <p className="text-xl font-bold whitespace-nowrap text-gray-900 dark:text-gray-50">
                  {v != null ? ind.formato(v) : '—'}
                </p>
                {comparavel && v > o && ind.formato(v) !== ind.formato(o) && (
                  <span className={`text-[10px] font-semibold uppercase px-1.5 rounded
                                    ${LADOS[lado].selo}`}>
                    maior
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {comparavel ? ind.diferenca(v, o) : ' '}
              </p>
            </div>
          )
        })}
      </div>

      {perfil.total < MIN_ELEITORES && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          ⚠ Menos de 10 mil eleitores: IEE e hiato ficam instáveis, por isso este
          município não entra no ranking.
        </p>
      )}
    </>
  )
}
