import { LADOS } from './lados'
import { decimalPtBR, percentualPtBR, comSinal } from '../../utils/formatos'

function Nome({ m }) {
  return <span className={`font-semibold ${LADOS[m.lado].texto}`}>{m.nome}</span>
}

export function FraseComparacao({ a, b }) {
  const [maisVelho, maisNovo] = a.perfil.mediana >= b.perfil.mediana ? [a, b] : [b, a]
  const empate = decimalPtBR(a.perfil.mediana) === decimalPtBR(b.perfil.mediana)

  return (
    <div className="card !py-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300
                    bg-gradient-to-r from-violet-500/5 to-emerald-500/5">
      <Nome m={a} /> tem {percentualPtBR(a.perfil.superior)} de eleitores com superior
      completo; <Nome m={b} />, {percentualPtBR(b.perfil.superior)}.{' '}
      {empate
        ? <>Os dois eleitorados têm a mesma idade mediana: {decimalPtBR(a.perfil.mediana)} anos.</>
        : (
          <>
            <Nome m={maisVelho} /> tem o eleitorado de idade mais alta: mediana
            de {decimalPtBR(maisVelho.perfil.mediana)} anos,
            contra {decimalPtBR(maisNovo.perfil.mediana)}.
          </>
        )}{' '}
      Hiato instrucional: {comSinal(a.perfil.hiato)} p.p. contra {comSinal(b.perfil.hiato)} p.p.
    </div>
  )
}
