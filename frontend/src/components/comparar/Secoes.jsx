import { CartaoLado }          from './CartaoLado'
import { ResumoComparado }     from './ResumoComparado'
import { PiramideEtariaChart } from '../charts/PiramideEtariaChart'
import { BarrasComparadasChart } from '../charts/BarrasComparadasChart'
import { abreviaEscolaridade } from '../../utils/formatos'

export function TituloSecao({ titulo, subtitulo }) {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-2 mb-3">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{titulo}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitulo}</p>
    </div>
  )
}

export function SecaoResumo({
  lados, pronto, indicadores,
  subtitulo = 'o selo indica o maior valor entre os dois municípios',
}) {
  return (
    <section>
      <TituloSecao titulo="Resumo" subtitulo={subtitulo} />
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

/**
 * Barras por categoria nos dois municípios, com o traço do outro lado.
 * `categorias(perfil)` devolve [{ codigo, descricao, total }] e `base(perfil)`
 * é o total sobre o qual o percentual é calculado.
 */
export function SecaoBarras({
  titulo, subtitulo, lados, pronto, percentual,
  categorias, base, rotulo, altura, ordenadas = true,
}) {
  const codigos = pronto
    ? [...new Set(lados.flatMap(l => categorias(l.perfil).map(e => e.codigo)))]
        .sort((x, y) => Number(x) - Number(y))
    : []
  const descricao = c => lados
    .flatMap(l => categorias(l.perfil))
    .find(e => e.codigo === c)?.descricao

  const valor = (perfil, codigo) => {
    const total = categorias(perfil).find(e => e.codigo === codigo)?.total ?? 0
    if (!percentual) return total
    return base(perfil) > 0 ? (total / base(perfil)) * 100 : 0
  }

  const linhas = pronto
    ? lados.map(l => codigos.map(c => ({
        codigo: c,
        rotulo: rotulo(descricao(c)),
        valor:  valor(l.perfil, c),
        outro:  valor(l.outro, c),
      })))
    : []
  const maximo = Math.max(...linhas.flat().flatMap(e => [e.valor, e.outro]), 0)

  return (
    <section>
      <TituloSecao titulo={titulo} subtitulo={subtitulo} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {lados.map((l, i) => (
          <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={altura}>
            {pronto && (
              <BarrasComparadasChart
                linhas={linhas[i]}
                maximo={maximo}
                percentual={percentual}
                nome={l.nome}
                nomeOutro={lados[1 - i].nome}
                ordenadas={ordenadas}
              />
            )}
          </CartaoLado>
        ))}
      </div>
    </section>
  )
}

export function SecaoEscolaridade({ lados, pronto, percentual }) {
  return (
    <SecaoBarras
      titulo="Escolaridade"
      subtitulo="barra = este município · traço = o outro, na mesma escala"
      lados={lados}
      pronto={pronto}
      percentual={percentual}
      categorias={perfil => perfil.escolaridade}
      base={perfil => perfil.total}
      rotulo={abreviaEscolaridade}
      altura={240}
    />
  )
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
