import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

/**
 * Gráfico de barras horizontais por faixa etária.
 *
 * @param {{ data: Array<{descricao: string, total: number}>, loading: boolean }} props
 */
export function FaixaEtariaChart({ data, loading }) {
  if (loading) return <Placeholder />

  const sorted = [...data].sort((a, b) => b.total - a.total)

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart
        layout="vertical"
        data={sorted}
        margin={{ top: 4, right: 32, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={n => `${(n / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="descricao"
          width={110}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={v => [v.toLocaleString('pt-BR'), 'Eleitores']}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
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
