import {
  BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

/**
 * Gráfico de barras com total de eleitores por estado (UF).
 * A barra de SP é destacada em azul escuro; as demais em azul claro.
 *
 * Permite comparação visual de SP com todos os demais estados do Brasil.
 *
 * @param {{ data: Array<{uf: string, total: number}>, loading: boolean }} props
 */
export function RegiaoChart({ data, loading }) {
  if (loading) return <Placeholder />

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 16, left: 16, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="uf"
          tick={{ fontSize: 11 }}
          interval={0}
        />
        <YAxis
          tickFormatter={n => `${(n / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={v => [v.toLocaleString('pt-BR'), 'Eleitores']}
          labelFormatter={uf => `Estado: ${uf}`}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.uf === 'SP' ? '#1d4ed8' : '#93c5fd'}
            />
          ))}
        </Bar>
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
