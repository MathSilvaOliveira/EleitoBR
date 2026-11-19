import {
  BarChart, Bar, XAxis, YAxis, LabelList,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useTema }    from '../../context/TemaContext'
import { useFiltros } from '../../context/FiltrosContext'
import { numeroCompacto, decimalPtBR, percentualPtBR, ORDEM_GENERO } from '../../utils/formatos'
import { escalaLinear } from '../../utils/estatisticas'
import { TooltipTotal } from './TooltipTotal'

// `maximo` fixa o eixo: na comparação, as duas pirâmides recebem o mesmo.
export function PiramideEtariaChart({
  data, percentual = false, maximo, altura = 480, destacarGenero = true,
}) {
  const { paleta } = useTema()
  const { genero } = useFiltros()

  // Gênero é o eixo deste gráfico, então ele não se filtra: só destaca a seleção.
  const ativo     = destacarGenero ? genero : null
  const opacidade = g => (!ativo || ativo === g ? 1 : 0.2)

  const rotuloEixo = percentual
    ? v => `${decimalPtBR(v, Number.isInteger(v) ? 0 : 1)}%`
    : numeroCompacto

  const validas = data.filter(d => Number(d.codigo) > 0)   // remove faixa 'inválida'

  const { topo, marcas } = escalaLinear(
    maximo ?? Math.max(...validas.map(d => Math.max(d.M, d.F)), 1), 3,
  )
  const vao     = topo * 0.18
  const lateral = marcas.slice(1).map(m => m + vao)

  const chartData = validas
    .map(d => ({
      faixa:     d.descricao.replace(' anos', '').replace(' ou mais', '+').replace(' a ', '–'),
      Masculino: -d.M,                    // negativo → lado esquerdo
      Feminino:  d.F,
      vaoM:      -vao,
      vaoF:      vao,
    }))
    .reverse()                            // mais velhos no topo

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        layout="vertical"
        data={chartData}
        stackOffset="sign"
        margin={{ top: 4, right: 16, left: 16, bottom: 4 }}
        barCategoryGap={2}
      >
        <XAxis
          type="number"
          domain={[-(topo + vao), topo + vao]}
          ticks={[...lateral.map(m => -m).reverse(), ...lateral]}
          tickFormatter={v => rotuloEixo(Number((Math.abs(v) - vao).toFixed(6)))}
          tick={{ fontSize: 11, fill: paleta.eixo }}
          stroke={paleta.grade}
        />
        <YAxis type="category" dataKey="faixa" hide />
        <Tooltip
          content={(
            <TooltipTotal
              paleta={paleta}
              ordem={ORDEM_GENERO}
              formato={percentual ? percentualPtBR : undefined}
            />
          )}
          cursor={{ fill: paleta.grade, opacity: 0.35 }}
        />
        <Legend
          itemSorter={item => (item.value === 'Masculino' ? 0 : 1)}
          formatter={v => (
            <span style={{ color: paleta.eixo, fontSize: 12 }}>{v}</span>
          )}
        />
        <Bar dataKey="vaoM" stackId="p" fill="none" legendType="none" tooltipType="none" />
        <Bar dataKey="vaoF" stackId="p" fill="none" legendType="none" tooltipType="none">
          <LabelList
            dataKey="faixa"
            content={({ x, y, height, value }) => (
              <text x={x} y={y + height / 2} textAnchor="middle" dominantBaseline="central"
                    fontSize={11} fill={paleta.eixo}>
                {value}
              </text>
            )}
          />
        </Bar>
        <Bar dataKey="Masculino" stackId="p" fill={paleta.masculino}
             fillOpacity={opacidade('M')} />
        <Bar dataKey="Feminino"  stackId="p" fill={paleta.feminino}
             fillOpacity={opacidade('F')} />
      </BarChart>
    </ResponsiveContainer>
  )
}
