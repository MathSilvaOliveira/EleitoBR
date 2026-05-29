import {
  PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const CORES = {
  F:  '#ec4899',
  M:  '#3b82f6',
  NI: '#94a3b8',
}

const LABELS = {
  F:  'Feminino',
  M:  'Masculino',
  NI: 'Não informado',
}

/**
 * Gráfico de pizza com distribuição por gênero.
 *
 * @param {{ data: Array<{genero: string, total: number}>, loading: boolean }} props
 */
export function GeneroChart({ data, loading }) {
  if (loading) return <Placeholder />

  const total = data.reduce((acc, d) => acc + d.total, 0)

  const chartData = data.map(d => ({
    name:  LABELS[d.genero] ?? d.genero,
    value: d.total,
    pct:   ((d.total / total) * 100).toFixed(1),
    cor:   CORES[d.genero]  ?? '#cbd5e1',
  }))

  return (
    <ResponsiveContainer width="100%" height={420}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          outerRadius={140}
          label={({ name, pct }) => `${name} ${pct}%`}
          labelLine={true}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.cor} />
          ))}
        </Pie>
        <Tooltip formatter={v => [v.toLocaleString('pt-BR'), 'Eleitores']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

function Placeholder() {
  return (
    <div className="flex items-center justify-center h-[420px] text-gray-400">
      Carregando...
    </div>
  )
}
