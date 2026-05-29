import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const ABREVIACOES = {
  'ANALFABETO':                     'Analfabeto',
  'LÊ E ESCREVE':                   'Lê e escreve',
  'ENSINO FUNDAMENTAL INCOMPLETO':  'Fund. incompleto',
  'ENSINO FUNDAMENTAL COMPLETO':    'Fund. completo',
  'ENSINO MÉDIO INCOMPLETO':        'Médio incompleto',
  'ENSINO MÉDIO COMPLETO':          'Médio completo',
  'SUPERIOR INCOMPLETO':            'Sup. incompleto',
  'SUPERIOR COMPLETO':              'Sup. completo',
  'NÃO INFORMADO':                  'Não informado',
}

/**
 * Gráfico de barras verticais por grau de instrução.
 *
 * Os rótulos originais do TSE são abreviados para caber no eixo X.
 *
 * @param {{ data: Array<{descricao: string, total: number}>, loading: boolean }} props
 */
export function EscolaridadeChart({ data, loading }) {
  if (loading) return <Placeholder />

  const sorted = [...data]
    .sort((a, b) => b.total - a.total)
    .map(d => ({
      ...d,
      label: ABREVIACOES[d.descricao.toUpperCase()] ?? d.descricao,
    }))

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart
        data={sorted}
        margin={{ top: 4, right: 16, left: 16, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          tickFormatter={n => `${(n / 1_000_000).toFixed(0)}M`}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={v => [v.toLocaleString('pt-BR'), 'Eleitores']} />
        <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
