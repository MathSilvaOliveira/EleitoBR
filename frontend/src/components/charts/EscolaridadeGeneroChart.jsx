import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { useTema } from '../../context/TemaContext'
import { abreviaEscolaridade, numeroCompacto, numeroPtBR } from '../../utils/formatos'

export function EscolaridadeGeneroChart({ data }) {
  const { paleta } = useTema()

  const chartData = data.map(d => ({
    label:      abreviaEscolaridade(d.descricao),
    Feminino:   d.F,
    Masculino:  d.M,
    'Não inf.': d.NI,
  }))

  return (
    <ResponsiveContainer width="100%" height={420}>
      <BarChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={paleta.grade} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: paleta.eixo }}
          angle={-35}
          textAnchor="end"
          interval={0}
          stroke={paleta.grade}
        />
        <YAxis
          tickFormatter={numeroCompacto}
          tick={{ fontSize: 12, fill: paleta.eixo }}
          stroke={paleta.grade}
        />
        <Tooltip
          formatter={(v, nome) => [numeroPtBR(v), nome]}
          contentStyle={{
            backgroundColor: paleta.tooltipBg,
            border: `1px solid ${paleta.borda}`,
            borderRadius: 8,
            color: paleta.tooltipTxt,
          }}
          labelStyle={{ color: paleta.tooltipTxt, fontWeight: 600 }}
          cursor={{ fill: paleta.grade, opacity: 0.35 }}
        />
        <Legend
         wrapperStyle={{ paddingTop: 12, bottom: 0 }}
         formatter={v => (
          <span style={{ color: paleta.eixo, fontSize: 12 }}>{v}</span>
        )} />
        <Bar dataKey="Feminino"  stackId="g" fill={paleta.feminino} />
        <Bar dataKey="Masculino" stackId="g" fill={paleta.masculino} />
        <Bar dataKey="Não inf."  stackId="g" fill={paleta.naoInf}
             radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
