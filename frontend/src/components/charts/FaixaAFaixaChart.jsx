import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useTema } from '../../context/TemaContext'
import { numeroCompacto, numeroPtBR, decimalPtBR, percentualPtBR } from '../../utils/formatos'
import { escalaLinear } from '../../utils/estatisticas'

export function FaixaAFaixaChart({ linhas, maximo, percentual, cor, corOutro, nome, nomeOutro }) {
  const { paleta } = useTema()
  const { topo, marcas } = escalaLinear(maximo, 6)

  const formato    = percentual ? percentualPtBR : numeroPtBR
  const rotuloEixo = percentual
    ? v => `${decimalPtBR(v, Number.isInteger(v) ? 0 : 1)}%`
    : numeroCompacto

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={linhas} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={paleta.grade} />
        <XAxis
          dataKey="faixa"
          tick={{ fontSize: 10, fill: paleta.eixo }}
          stroke={paleta.grade}
        />
        <YAxis
          domain={[0, topo]}
          ticks={marcas}
          tickFormatter={rotuloEixo}
          width={percentual ? 40 : 64}
          tick={{ fontSize: 11, fill: paleta.eixo }}
          stroke={paleta.grade}
        />
        <Tooltip
          itemSorter={item => (item.dataKey === 'outro' ? 1 : 0)}
          formatter={v => formato(v)}
          labelFormatter={f => `${f} anos`}
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
          itemSorter={item => (item.type === 'line' ? 1 : 0)}
          formatter={(v, entry) => (
            <span style={{ color: paleta.eixo, fontSize: 12 }}>
              {entry.type === 'line' ? `${v} (linha tracejada)` : v}
            </span>
          )}
        />
        <Bar dataKey="valor" name={nome} fill={cor} radius={[3, 3, 0, 0]} />
        <Line
          dataKey="outro"
          name={nomeOutro}
          type="monotone"
          stroke={corOutro}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
