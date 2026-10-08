import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import { useTema }    from '../../context/TemaContext'
import { useFiltros } from '../../context/FiltrosContext'
import { abreviaEscolaridade, numeroCompacto } from '../../utils/formatos'
import { TooltipTotal, ORDEM_GENERO } from './TooltipTotal'

export function EscolaridadeGeneroChart({ data }) {
  const { paleta } = useTema()
  const { genero } = useFiltros()

  // Gênero é o eixo deste gráfico, então ele não se filtra: só destaca a seleção.
  const opacidade = g => (!genero || genero === g ? 1 : 0.2)

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
          content={<TooltipTotal paleta={paleta} ordem={ORDEM_GENERO} />}
          cursor={{ fill: paleta.grade, opacity: 0.35 }}
        />
        <Legend
         wrapperStyle={{ paddingTop: 12, bottom: 0 }}
         formatter={v => (
          <span style={{ color: paleta.eixo, fontSize: 12 }}>{v}</span>
        )} />
        <Bar dataKey="Feminino"  stackId="g" fill={paleta.feminino}
             fillOpacity={opacidade('F')} />
        <Bar dataKey="Masculino" stackId="g" fill={paleta.masculino}
             fillOpacity={opacidade('M')} />
        <Bar dataKey="Não inf."  stackId="g" fill={paleta.naoInf}
             fillOpacity={opacidade('NI')} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
