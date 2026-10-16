import { LADOS } from './lados'
import { decimalPtBR, percentualPtBR, comSinal } from '../../utils/formatos'

function Nome({ m }) {
  return <span className={`font-semibold ${LADOS[m.lado].texto}`}>{m.nome}</span>
}

function Caixa({ children }) {
  return (
    <div className="card !py-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300
                    bg-gradient-to-r from-violet-500/5 to-emerald-500/5">
      {children}
    </div>
  )
}

function Mediana({ a, b }) {
  const [maisVelho, maisNovo] = a.perfil.mediana >= b.perfil.mediana ? [a, b] : [b, a]

  if (decimalPtBR(a.perfil.mediana) === decimalPtBR(b.perfil.mediana)) {
    return <>Os dois eleitorados têm a mesma idade mediana: {decimalPtBR(a.perfil.mediana)} anos.</>
  }

  return (
    <>
      <Nome m={maisVelho} /> tem o eleitorado de idade mais alta: mediana
      de {decimalPtBR(maisVelho.perfil.mediana)} anos,
      contra {decimalPtBR(maisNovo.perfil.mediana)}.
    </>
  )
}

export function FraseComparacao({ a, b }) {
  return (
    <Caixa>
      <Nome m={a} /> tem {percentualPtBR(a.perfil.superior)} de eleitores com superior
      completo; <Nome m={b} />, {percentualPtBR(b.perfil.superior)}.{' '}
      <Mediana a={a} b={b} />{' '}
      Hiato instrucional: {comSinal(a.perfil.hiato)} p.p. contra {comSinal(b.perfil.hiato)} p.p.
    </Caixa>
  )
}

export function FraseIdade({ a, b }) {
  return (
    <Caixa>
      <Mediana a={a} b={b} />{' '}
      <Nome m={a} /> tem {percentualPtBR(a.perfil.idosos)} de eleitores com 60 anos ou mais
      e {percentualPtBR(a.perfil.facultativo)} com voto facultativo; <Nome m={b} />,
      {' '}{percentualPtBR(b.perfil.idosos)} e {percentualPtBR(b.perfil.facultativo)}.
    </Caixa>
  )
}
