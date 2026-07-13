import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'
import { useTema } from '../../context/TemaContext'
import { numeroCompacto, numeroPtBR } from '../../utils/formatos'

export function PiramideEtariaChart({ data }) {
  const { paleta } = useTema()

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
          formatter={(v, nome) => [numeroPtBR(Math.abs(v)), nome]}
          contentStyle={{
            backgroundColor: paleta.tooltipBg,
            border: `1px solid ${paleta.borda}`,
            borderRadius: 8,
            color: paleta.tooltipTxt,
          }}
          labelStyle={{ color: paleta.tooltipTxt, fontWeight: 600 }}
          cursor={{ fill: paleta.grade, opacity: 0.35 }}
        />
        <Legend formatter={v => (
          <span style={{ color: paleta.eixo, fontSize: 12 }}>{v}</span>
        )} />
        <Bar dataKey="Masculino" stackId="p" fill={paleta.masculino} />
        <Bar dataKey="Feminino"  stackId="p" fill={paleta.feminino} />
      </BarChart>
    </ResponsiveContainer>
  )
}
