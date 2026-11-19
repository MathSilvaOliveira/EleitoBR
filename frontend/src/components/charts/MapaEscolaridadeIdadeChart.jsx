import { useTema } from '../../context/TemaContext'
import {
  BUCKETS_COMPARACAO_ROTULOS, decimalPtBR, numeroPtBR, percentualPtBR,
} from '../../utils/formatos'

export function MapaEscolaridadeIdadeChart({ linhas, maximo }) {
  const { paleta, tema } = useTema()

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-[3px] min-w-[400px]"
        style={{ gridTemplateColumns: `100px repeat(${BUCKETS_COMPARACAO_ROTULOS.length}, minmax(0, 1fr))` }}
      >
        <div />
        {BUCKETS_COMPARACAO_ROTULOS.map(b => (
          <div key={b} className="text-center text-[11px] font-medium
                                  text-gray-500 dark:text-gray-400 pb-1">
            {b}
          </div>
        ))}

        {linhas.map(l => (
          <Linha key={l.codigo} linha={l} maximo={maximo} paleta={paleta} tema={tema} />
        ))}
      </div>
    </div>
  )
}

function Linha({ linha, maximo, paleta, tema }) {
  return (
    <>
      <div className="text-[11px] text-right pr-2 self-center
                      text-gray-600 dark:text-gray-300">
        {linha.rotulo}
      </div>
      {linha.celulas.map(c => {
        const intensidade = maximo > 0 ? Math.max(c.pct / maximo, 0.04) : 0.04
        const textoClaro  = tema === 'dark' ? intensidade < 0.72 : intensidade >= 0.84

        return (
          <div
            key={c.faixa}
            className={`h-9 rounded-[4px] flex items-center justify-center
                        text-[11px] font-medium tabular-nums cursor-crosshair
                        transition-transform hover:scale-[1.06] hover:ring-1 hover:ring-blue-400
                        ${textoClaro ? 'text-white' : 'text-gray-900'}`}
            style={{ backgroundColor: `rgba(${paleta.sequencialRgb}, ${intensidade.toFixed(2)})` }}
            title={`${linha.rotulo} · ${c.faixa} anos: ${percentualPtBR(c.pct)} (${numeroPtBR(c.total)} eleitores)`}
          >
            {Number(c.pct.toFixed(1)) >= 0.4 && decimalPtBR(c.pct)}
          </div>
        )
      })}
    </>
  )
}
