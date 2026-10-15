import { useTema } from '../../context/TemaContext'
import { numeroCompacto, percentualPtBR } from '../../utils/formatos'
import { escalaLinear } from '../../utils/estatisticas'

export function EscolaridadeComparadaChart({ linhas, maximo, percentual, nome, nomeOutro }) {
  const { paleta } = useTema()
  const { topo, marcas } = escalaLinear(maximo, 4)

  const formato    = percentual ? percentualPtBR : numeroCompacto
  const rotuloEixo = percentual ? v => percentualPtBR(v, 0) : numeroCompacto
  const posicao    = v => `${(v / topo) * 100}%`

  const cor = i => {
    const t = linhas.length > 1 ? i / (linhas.length - 1) : 0
    return `color-mix(in srgb, ${paleta.acento} ${Math.round(t * 100)}%, ${paleta.primaria})`
  }

  return (
    <div className="flex gap-3">
      <div className="w-28 shrink-0 space-y-2">
        {linhas.map(l => (
          <p key={l.codigo}
             className="h-5 flex items-center justify-end text-[11px] text-right
                        text-gray-600 dark:text-gray-300">
            {l.rotulo}
          </p>
        ))}
      </div>

      <div className="flex-1 pr-12">
        <div className="relative space-y-2">
          {marcas.map(m => (
            <div key={m} className="absolute inset-y-0 w-px bg-gray-100 dark:bg-gray-700/60"
                 style={{ left: posicao(m) }} />
          ))}

          {linhas.map((l, i) => (
            <div key={l.codigo} className="relative h-5"
                 title={`${l.rotulo} · ${nome}: ${formato(l.valor)} · ${nomeOutro}: ${formato(l.outro)}`}>
              <div className="absolute inset-y-0 left-0 rounded"
                   style={{ width: posicao(l.valor), backgroundColor: cor(i) }} />
              <div className="absolute -inset-y-1 w-0.5 -ml-px rounded-full
                              bg-gray-600 dark:bg-gray-100"
                   style={{ left: posicao(l.outro) }} />
              {/* O fundo do número encobre o traço quando os dois se cruzam. */}
              <span className="absolute top-1/2 -translate-y-1/2 ml-1 px-0.5 rounded-sm
                               text-[11px] leading-none tabular-nums
                               bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    style={{ left: posicao(l.valor) }}>
                {formato(l.valor)}
              </span>
            </div>
          ))}
        </div>

        <div className="relative h-4 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
          {marcas.map(m => (
            <span key={m} className="absolute -translate-x-1/2 tabular-nums"
                  style={{ left: posicao(m) }}>
              {rotuloEixo(m)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
