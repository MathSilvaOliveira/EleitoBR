import { useMemo, useState } from 'react'
import { useTema } from '../../context/TemaContext'
import {
  bucketFaixa, BUCKETS_ROTULOS,
  abreviaEscolaridade, numeroPtBR,
} from '../../utils/formatos'

export function HeatmapEscolaridadeFaixa({ data }) {
  const { tema } = useTema()
  const [hover, setHover] = useState(null)   // { esc, faixa, valor, pct }

  const { linhas, maxPct, total } = useMemo(() => {
    if (!data?.celulas) return { linhas: [], maxPct: 0, total: 0 }

    const escOrdenadas = data.escolaridades
      .filter(e => e.descricao.toUpperCase() !== 'NÃO INFORMADO')

    // matriz[escCodigo][bucket] = soma
    const matriz = new Map(
      escOrdenadas.map(e => [e.codigo, new Map(BUCKETS_ROTULOS.map(b => [b, 0]))]),
    )

    let total = 0
    for (const c of data.celulas) {
      const bucket = bucketFaixa(c.faixa)
      const linha  = matriz.get(c.escolaridade)
      if (!bucket || !linha) continue
      linha.set(bucket, linha.get(bucket) + c.total)
      total += c.total
    }

    let maxPct = 0
    const linhas = escOrdenadas.map(e => {
      const celulas = BUCKETS_ROTULOS.map(b => {
        const valor = matriz.get(e.codigo).get(b)
        const pct   = total > 0 ? (valor / total) * 100 : 0
        if (pct > maxPct) maxPct = pct
        return { bucket: b, valor, pct }
      })
      return { codigo: e.codigo, descricao: abreviaEscolaridade(e.descricao), celulas }
    })

    return { linhas, maxPct, total }
  }, [data])

  if (linhas.length === 0) return null

  const corBase = tema === 'dark' ? '96, 165, 250' : '37, 99, 235'  // azul RGB

  return (
    <div className="overflow-x-auto pb-3">
      <div
        className="grid gap-[3px] min-w-[560px]"
        style={{ gridTemplateColumns: `130px repeat(${BUCKETS_ROTULOS.length}, 1fr)` }}
      >
        {/* Cabeçalho */}
        <div />
        {BUCKETS_ROTULOS.map(b => (
          <div key={b} className="text-center text-[11px] font-medium
                                  text-gray-500 dark:text-gray-400 pb-1">
            {b}
          </div>
        ))}

        {/* Linhas */}
        {linhas.map(l => (
          <FragmentoLinha
            key={l.codigo}
            linha={l}
            maxPct={maxPct}
            corBase={corBase}
            onHover={setHover}
          />
        ))}
      </div>

      {/* Legenda de intensidade + leitura da célula em hover */}
      <div className="mt-3 flex items-center justify-between text-xs
                      text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>menor</span>
          <div className="flex">
            {[0.15, 0.35, 0.55, 0.75, 1].map(op => (
              <div key={op} className="w-6 h-3"
                   style={{ backgroundColor: `rgba(${corBase}, ${op})` }} />
            ))}
          </div>
          <span>maior participação</span>
        </div>
        <div className="font-medium text-gray-700 dark:text-gray-300 min-h-4">
          {hover
            ? `${hover.esc} · ${hover.faixa} anos: ${numeroPtBR(hover.valor)} eleitores (${hover.pct.toFixed(1)}% do total)`
            : `Total considerado: ${numeroPtBR(total)} eleitores`}
        </div>
      </div>
    </div>
  )
}

function FragmentoLinha({ linha, maxPct, corBase, onHover }) {
  return (
    <>
      <div className="text-[11px] text-right pr-2 self-center
                      text-gray-600 dark:text-gray-300">
        {linha.descricao}
      </div>
      {linha.celulas.map(c => {
        const intensidade = maxPct > 0 ? Math.max(c.pct / maxPct, 0.04) : 0.04
        return (
          <div
            key={c.bucket}
            className="h-9 rounded-[4px] cursor-crosshair transition-transform
                       hover:scale-[1.06] hover:ring-1 hover:ring-blue-400"
            style={{ backgroundColor: `rgba(${corBase}, ${intensidade.toFixed(2)})` }}
            title={`${linha.descricao} · ${c.bucket}: ${numeroPtBR(c.valor)}`}
            onMouseEnter={() => onHover({
              esc: linha.descricao, faixa: c.bucket, valor: c.valor, pct: c.pct,
            })}
            onMouseLeave={() => onHover(null)}
          />
        )
      })}
    </>
  )
}
