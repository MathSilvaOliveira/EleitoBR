import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useTema }    from '../../context/TemaContext'
import { useFiltros } from '../../context/FiltrosContext'
import { numeroCompacto, numeroPtBR, GENERO_ROTULO } from '../../utils/formatos'

export function GeneroChart({ data }) {
  const { paleta }            = useTema()
  const { genero, setGenero } = useFiltros()

  const CORES = { F: paleta.feminino, M: paleta.masculino, NI: paleta.naoInf }
  const total = data.reduce((acc, d) => acc + d.total, 0)

  const chartData = data.map(d => ({
    genero: d.genero,
    name:   GENERO_ROTULO[d.genero] ?? d.genero,
    value:  d.total,
    pct:    total > 0 ? ((d.total / total) * 100).toFixed(1) : 0,
    cor:    CORES[d.genero] ?? paleta.naoInf,
  }))

  const selecionada = chartData.find(d => d.genero === genero)

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={420}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%" cy="46%"
            innerRadius={82}
            outerRadius={140}
            paddingAngle={2}
            cursor="pointer"
            onClick={(_, i) => {
              const alvo = chartData[i]?.genero
              setGenero(alvo === genero ? null : alvo)
            }}
            label={({ name, pct }) => `${name} ${pct}%`}
            labelLine
          >
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.cor}
                stroke="none"
                fillOpacity={!genero || entry.genero === genero ? 1 : 0.25}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={v => [numeroPtBR(v), 'Eleitores']}
            contentStyle={{
              backgroundColor: paleta.tooltipBg,
              border: `1px solid ${paleta.borda}`,
              borderRadius: 8,
              color: paleta.tooltipTxt,
            }}
          />
          <Legend formatter={v => (
            <span style={{ color: paleta.eixo, fontSize: 12 }}>{v}</span>
          )} />
        </PieChart>
      </ResponsiveContainer>

      {/* Total no centro do donut */}
      <div className="rotulo-grafico absolute top-[46%] left-1/2 -translate-x-1/2
                      -translate-y-1/2 text-center pointer-events-none">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {numeroCompacto(selecionada ? selecionada.value : total)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selecionada ? selecionada.name.toLowerCase() : 'eleitores'}
        </p>
      </div>
    </div>
  )
}
