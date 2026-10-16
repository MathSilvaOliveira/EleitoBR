import { useState } from 'react'
import {
  PieChart, Pie, Cell, Curve, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTema }    from '../../context/TemaContext'
import { useFiltros } from '../../context/FiltrosContext'
import { numeroCompacto, numeroPtBR, percentualPtBR, GENERO_ROTULO } from '../../utils/formatos'

const FORMATOS = {
  painel:   { altura: 420, cy: '46%', interno: 82, externo: 140 },
  compacto: { altura: 200, cy: '50%', interno: 62, externo: 92 },
}

// `compacto`: versão da comparação, sem drill-down e com a legenda ao lado. No
// lugar do tooltip, que cobriria o centro, o hover leva a fatia para o centro.
export function GeneroChart({ data, compacto = false }) {
  const { paleta }            = useTema()
  const { genero, setGenero } = useFiltros()
  const [foco, setFoco]       = useState(null)

  const f     = FORMATOS[compacto ? 'compacto' : 'painel']
  const ativo = compacto ? foco : genero

  const CORES = { F: paleta.feminino, M: paleta.masculino, NI: paleta.naoInf }
  const total = data.reduce((acc, d) => acc + d.total, 0)

  const chartData = data.map(d => ({
    genero: d.genero,
    name:   GENERO_ROTULO[d.genero] ?? d.genero,
    value:  d.total,
    pct:    total > 0 ? (d.total / total) * 100 : 0,
    cor:    CORES[d.genero] ?? paleta.naoInf,
  }))

  const selecionada = chartData.find(d => d.genero === ativo)

  const donut = (
    <div className={`relative ${compacto ? 'w-52 shrink-0' : ''}`}>
      <ResponsiveContainer width="100%" height={f.altura}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%" cy={f.cy}
            innerRadius={f.interno}
            outerRadius={f.externo}
            paddingAngle={2}
            cursor={compacto ? undefined : 'pointer'}
            onClick={compacto ? undefined : (_, i) => {
              const alvo = chartData[i]?.genero
              setGenero(alvo === genero ? null : alvo)
            }}
            onMouseEnter={compacto ? (_, i) => setFoco(chartData[i]?.genero) : undefined}
            onMouseLeave={compacto ? () => setFoco(null) : undefined}
            label={compacto ? false : ({ name, pct }) => (
              pct >= 1 ? `${name} ${percentualPtBR(pct)}` : null
            )}
            labelLine={compacto ? false : ({ pct, points, stroke }) => (
              pct >= 1
                ? <Curve points={points} stroke={stroke} fill="none" type="linear"
                         className="recharts-pie-label-line" />
                : null
            )}
          >
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.cor}
                stroke="none"
                fillOpacity={!ativo || entry.genero === ativo ? 1 : 0.25}
              />
            ))}
          </Pie>
          {!compacto && (
            <Tooltip
              formatter={v => [numeroPtBR(v), 'Eleitores']}
              contentStyle={{
                backgroundColor: paleta.tooltipBg,
                border: `1px solid ${paleta.borda}`,
                borderRadius: 8,
                color: paleta.tooltipTxt,
              }}
            />
          )}
          {!compacto && (
            <Legend formatter={v => (
              <span style={{ color: paleta.eixo, fontSize: 12 }}>{v}</span>
            )} />
          )}
        </PieChart>
      </ResponsiveContainer>

      {/* Total no centro do donut */}
      <div className="rotulo-grafico absolute left-1/2 -translate-x-1/2 -translate-y-1/2
                      text-center pointer-events-none"
           style={{ top: f.cy }}>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {numeroCompacto(selecionada ? selecionada.value : total)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selecionada ? selecionada.name.toLowerCase() : 'eleitores'}
        </p>
      </div>
    </div>
  )

  if (!compacto) return donut

  return (
    <div className="flex items-center justify-center gap-8">
      {donut}
      <ul className="space-y-3">
        {chartData.map(d => (
          <li key={d.genero} className="flex items-start gap-2 text-xs">
            <span className="mt-0.5 w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: d.cor }} />
            <span>
              <span className="block font-medium text-gray-700 dark:text-gray-200">{d.name}</span>
              <span className="block tabular-nums text-gray-400 dark:text-gray-500">
                {percentualPtBR(d.pct)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
