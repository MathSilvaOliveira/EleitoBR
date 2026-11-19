import { useTema } from '../../context/TemaContext'
import { comSinal, percentualPtBR } from '../../utils/formatos'
import { escalaLinear } from '../../utils/estatisticas'

export function EscolaridadeGeneroComparadaChart({ linhas, maximo }) {
  const { paleta } = useTema()
  const { topo, marcas } = escalaLinear(maximo, 4)

  const posicao = v => `${(v / topo) * 100}%`
  const generos = [
    { chave: 'M', rotulo: 'Masculino', cor: paleta.masculino },
    { chave: 'F', rotulo: 'Feminino',  cor: paleta.feminino },
  ]

  return (
    <div>
      <div className="flex gap-3">
        <div className="w-28 shrink-0 space-y-3">
          {linhas.map(l => (
            <p key={l.codigo}
               className="h-6 flex items-center justify-end text-[11px] text-right
                          text-gray-600 dark:text-gray-300">
              {l.rotulo}
            </p>
          ))}
        </div>

        <div className="flex-1 pr-14">
          <div className="relative space-y-3">
            {marcas.map(m => (
              <div key={m} className="absolute inset-y-0 w-px bg-gray-100 dark:bg-gray-700/60"
                   style={{ left: posicao(m) }} />
            ))}

            {linhas.map(l => {
              const diferenca = l.M - l.F
              const maior     = diferenca >= 0 ? generos[0] : generos[1]

              return (
                <div key={l.codigo} className="relative h-6 flex flex-col justify-center gap-0.5"
                     title={`${l.rotulo} · Masculino: ${percentualPtBR(l.M)} · Feminino: ${percentualPtBR(l.F)}`}>
                  {generos.map(g => (
                    <div key={g.chave} className="h-2.5 rounded-sm"
                         style={{ width: posicao(l[g.chave]), backgroundColor: g.cor }} />
                  ))}
                  {Number(Math.abs(diferenca).toFixed(1)) >= 0.3 && (
                    <span className="absolute top-1/2 -translate-y-1/2 pl-1.5 text-[11px]
                                     font-medium tabular-nums whitespace-nowrap"
                          style={{ left: posicao(Math.max(l.M, l.F)), color: maior.cor }}>
                      {maior.chave} {comSinal(Math.abs(diferenca))}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="relative h-4 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
            {marcas.map(m => (
              <span key={m} className="absolute -translate-x-1/2 tabular-nums"
                    style={{ left: posicao(m) }}>
                {percentualPtBR(m, 0)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-3 flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        {generos.map(g => (
          <li key={g.chave} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: g.cor }} />
            {g.rotulo}
          </li>
        ))}
      </ul>
    </div>
  )
}
