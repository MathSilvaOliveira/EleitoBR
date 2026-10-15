import { usePerfilMunicipio } from '../../hooks/usePerfilMunicipio'
import { ErroCarga, Skeleton } from '../ui/Primitivas'
import { CartaoLado }        from './CartaoLado'
import { FraseComparacao }   from './FraseComparacao'
import { ResumoComparado }   from './ResumoComparado'
import { PiramideEtariaChart }        from '../charts/PiramideEtariaChart'
import { GeneroChart }                from '../charts/GeneroChart'
import { EscolaridadeComparadaChart } from '../charts/EscolaridadeComparadaChart'
import { abreviaEscolaridade, nomeProprio } from '../../utils/formatos'

function TituloSecao({ titulo, subtitulo }) {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-2 mb-3">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{titulo}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtitulo}</p>
    </div>
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

function escolaridade(perfil, codigo, percentual) {
  const total = perfil.escolaridade.find(e => e.codigo === codigo)?.total ?? 0
  return percentual ? (total / perfil.total) * 100 : total
}

export function VisaoGeral({ a, b, percentual }) {
  const perfilA = usePerfilMunicipio(a.id)
  const perfilB = usePerfilMunicipio(b.id)

  const error = perfilA.error ?? perfilB.error
  if (error) return <ErroCarga mensagem={error} altura={240} />

  const pronto = perfilA.perfil && perfilB.perfil

  const lados = [
    { lado: 'a', municipio: a, perfil: perfilA.perfil, outro: perfilB.perfil },
    { lado: 'b', municipio: b, perfil: perfilB.perfil, outro: perfilA.perfil },
  ].map(l => ({
    ...l,
    nome:    nomeProprio(l.municipio.nome) ?? '…',
    rotulo:  l.municipio.nome ? `${nomeProprio(l.municipio.nome)} – ${l.municipio.uf}` : '…',
  }))

  const piramides = pronto ? lados.map(l => piramide(l.perfil, percentual)) : []
  const maxPiramide = Math.max(...piramides.flat().flatMap(f => [f.M, f.F]), 0)

  const codigos = pronto
    ? [...new Set(lados.flatMap(l => l.perfil.escolaridade.map(e => e.codigo)))]
        .sort((x, y) => Number(x) - Number(y))
    : []
  const descricao = c => lados
    .flatMap(l => l.perfil.escolaridade)
    .find(e => e.codigo === c)?.descricao

  const escolaridades = pronto
    ? lados.map(l => codigos.map(c => ({
        codigo: c,
        rotulo: abreviaEscolaridade(descricao(c)),
        valor:  escolaridade(l.perfil, c, percentual),
        outro:  escolaridade(l.outro, c, percentual),
      })))
    : []
  const maxEscolaridade = Math.max(...escolaridades.flat().flatMap(e => [e.valor, e.outro]), 0)

  return (
    <>
      {pronto
        ? <FraseComparacao a={lados[0]} b={lados[1]} />
        : <Skeleton altura={72} />}

      <section>
        <TituloSecao titulo="Resumo" subtitulo="o selo indica o maior valor entre os dois municípios" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lados.map(l => (
            <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={170}>
              {pronto && <ResumoComparado lado={l.lado} perfil={l.perfil} outro={l.outro} />}
            </CartaoLado>
          ))}
        </div>
      </section>

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
                  maximo={maxPiramide}
                  altura={360}
                  destacarGenero={false}
                />
              )}
            </CartaoLado>
          ))}
        </div>
      </section>

      <section>
        <TituloSecao titulo="Gênero" subtitulo="composição do eleitorado" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lados.map(l => (
            <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={220}>
              {pronto && <GeneroChart data={l.perfil.generos} compacto />}
            </CartaoLado>
          ))}
        </div>
      </section>

      <section>
        <TituloSecao
          titulo="Escolaridade"
          subtitulo="barra = este município · traço = o outro, na mesma escala"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lados.map((l, i) => (
            <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={240}>
              {pronto && (
                <EscolaridadeComparadaChart
                  linhas={escolaridades[i]}
                  maximo={maxEscolaridade}
                  percentual={percentual}
                  nome={l.nome}
                  nomeOutro={lados[1 - i].nome}
                />
              )}
            </CartaoLado>
          ))}
        </div>
      </section>
    </>
  )
}
