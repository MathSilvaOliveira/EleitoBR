import {
  BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useTema }    from '../../context/TemaContext'
import { useFiltros } from '../../context/FiltrosContext'
import { numeroCompacto, numeroPtBR } from '../../utils/formatos'

export function RegiaoChart({ data }) {
  const { paleta }     = useTema()
  const { uf, setUf }  = useFiltros()

  const ufAtiva = uf ?? 'SP'

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[620px]">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={paleta.grade} />
            <XAxis
              dataKey="uf"
              tick={{ fontSize: 11, fill: paleta.eixo }}
              interval={0}
              stroke={paleta.grade}
            />
            <YAxis
              tickFormatter={numeroCompacto}
              tick={{ fontSize: 12, fill: paleta.eixo }}
              stroke={paleta.grade}
            />
            <Tooltip
              formatter={v => [numeroPtBR(v), 'Eleitores']}
              labelFormatter={u => `Estado: ${u} — clique para filtrar`}
              contentStyle={{
                backgroundColor: paleta.tooltipBg,
                border: `1px solid ${paleta.borda}`,
                borderRadius: 8,
                color: paleta.tooltipTxt,
              }}
              labelStyle={{ color: paleta.tooltipTxt, fontWeight: 600 }}
              cursor={{ fill: paleta.grade, opacity: 0.35 }}
            />
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={entry => setUf(entry.uf === uf ? null : entry.uf)}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.uf === ufAtiva ? paleta.destaque : paleta.suave}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
