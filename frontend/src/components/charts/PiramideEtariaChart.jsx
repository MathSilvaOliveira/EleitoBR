import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { useTema }    from '../../context/TemaContext'
import { useFiltros } from '../../context/FiltrosContext'
import { numeroCompacto } from '../../utils/formatos'
import { TooltipTotal, ORDEM_GENERO } from './TooltipTotal'

export function PiramideEtariaChart({ data }) {
  const { paleta } = useTema()
  const { genero } = useFiltros()

  // Gênero é o eixo deste gráfico, então ele não se filtra: só destaca a seleção.
  const opacidade = g => (!genero || genero === g ? 1 : 0.2)

  const chartData = data
    .filter(d => Number(d.codigo) > 0)   // remove faixa 'inválida'
    .map(d => ({
      faixa:     d.descricao.replace(' anos', ''),
      Masculino: -d.M,                    // negativo → lado esquerdo
      Feminino:  d.F,
    }))
    .reverse()                            // mais velhos no topo

  const maxAbs = Math.max(
    ...chartData.map(d => Math.max(Math.abs(d.Masculino), d.Feminino)), 1,
  )

  return (
    <ResponsiveContainer width="100%" height={480}>
      <BarChart
        layout="vertical"
        data={chartData}
        stackOffset="sign"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
        barCategoryGap={2}
      >
        <XAxis
          type="number"
          domain={[-maxAbs, maxAbs]}
          tickFormatter={v => numeroCompacto(Math.abs(v))}
          tick={{ fontSize: 11, fill: paleta.eixo }}
          stroke={paleta.grade}
        />
        <YAxis
          type="category"
          dataKey="faixa"
          width={78}
          tick={{ fontSize: 11, fill: paleta.eixo }}
          stroke={paleta.grade}
        />
        <ReferenceLine x={0} stroke={paleta.eixo} />
        <Tooltip
          content={<TooltipTotal paleta={paleta} ordem={ORDEM_GENERO} />}
          cursor={{ fill: paleta.grade, opacity: 0.35 }}
        />
        <Legend formatter={v => (
          <span style={{ color: paleta.eixo, fontSize: 12 }}>{v}</span>
        )} />
        <Bar dataKey="Masculino" stackId="p" fill={paleta.masculino}
             fillOpacity={opacidade('M')} />
        <Bar dataKey="Feminino"  stackId="p" fill={paleta.feminino}
             fillOpacity={opacidade('F')} />
      </BarChart>
    </ResponsiveContainer>
  )
}
