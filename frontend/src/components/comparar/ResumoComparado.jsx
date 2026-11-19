import { LADOS } from './lados'

// Mesmo corte do ranking de municípios.
const MIN_ELEITORES = 10_000

export function ResumoComparado({ lado, perfil, outro, indicadores }) {
  const instavel = perfil.total < MIN_ELEITORES
    && indicadores.some(ind => ind.chave === 'iee' || ind.chave === 'hiato')

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {indicadores.map(ind => {
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
                <p className={`${ind.texto ? 'text-base leading-7' : 'text-xl'}
                               font-bold whitespace-nowrap text-gray-900 dark:text-gray-50`}>
                  {v != null ? ind.formato(v) : '—'}
                </p>
                {ind.selo !== false && comparavel && v > o && ind.formato(v) !== ind.formato(o) && (
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

      {instavel && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
          ⚠ Menos de 10 mil eleitores: IEE e hiato ficam instáveis, por isso este
          município não entra no ranking.
        </p>
      )}
    </>
  )
}
