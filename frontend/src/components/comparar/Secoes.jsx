import { CartaoLado }          from './CartaoLado'
import { ResumoComparado }     from './ResumoComparado'
import { PiramideEtariaChart } from '../charts/PiramideEtariaChart'

export function TituloSecao({ titulo, subtitulo }) {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-2 mb-3">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{titulo}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitulo}</p>
    </div>
  )
}

export function SecaoResumo({ lados, pronto, indicadores }) {
  return (
    <section>
      <TituloSecao titulo="Resumo" subtitulo="o selo indica o maior valor entre os dois municípios" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lados.map(l => (
          <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={170}>
            {pronto && (
              <ResumoComparado
                lado={l.lado}
                perfil={l.perfil}
                outro={l.outro}
                indicadores={indicadores}
              />
            )}
          </CartaoLado>
        ))}
      </div>
    </section>
  )
}

function piramide(perfil, percentual) {
  if (!percentual) return perfil.piramide
  return perfil.piramide.map(f => ({
    ...f,
    M: (f.M / perfil.total) * 100,
    F: (f.F / perfil.total) * 100,
  }))
}

export function SecaoPiramide({ lados, pronto, percentual }) {
  const piramides = pronto ? lados.map(l => piramide(l.perfil, percentual)) : []
  const maximo    = Math.max(...piramides.flat().flatMap(f => [f.M, f.F]), 0)

  return (
    <section>
      <TituloSecao
        titulo="Pirâmide etária"
        subtitulo={percentual
          ? '% do eleitorado por faixa e gênero · mesma escala'
          : 'eleitores por faixa e gênero · mesma escala'}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lados.map((l, i) => (
          <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={360}>
            {pronto && (
              <PiramideEtariaChart
                data={piramides[i]}
                percentual={percentual}
                maximo={maximo}
                altura={360}
                destacarGenero={false}
              />
            )}
          </CartaoLado>
        ))}
      </div>
    </section>
  )
}
