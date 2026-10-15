import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
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
    ? v => `${decimalPtBR(Math.abs(v), Number.isInteger(v) ? 0 : 1)}%`
    : v => numeroCompacto(Math.abs(v))

  const chartData = data
    .filter(d => Number(d.codigo) > 0)   // remove faixa 'inválida'
    .map(d => ({
      faixa:     d.descricao.replace(' anos', ''),
      Masculino: -d.M,                    // negativo → lado esquerdo
      Feminino:  d.F,
    }))
    .reverse()                            // mais velhos no topo

  const eixo   = maximo != null ? escalaLinear(maximo, 3) : null
  const marcas = eixo
    ? [...eixo.marcas.slice(1).map(m => -m).reverse(), ...eixo.marcas]
    : undefined

  const maxAbs = eixo?.topo ?? Math.max(
    ...chartData.map(d => Math.max(Math.abs(d.Masculino), d.Feminino)), 1,
  )

  return (
    <ResponsiveContainer width="100%" height={altura}>
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
          ticks={marcas}
          tickFormatter={rotuloEixo}
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
          content={(
            <TooltipTotal
              paleta={paleta}
              ordem={ORDEM_GENERO}
              formato={percentual ? percentualPtBR : undefined}
            />
          )}
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
