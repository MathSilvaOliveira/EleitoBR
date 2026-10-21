import { CartaoLado }  from './CartaoLado'
import { indicadores } from './indicadores'
import { SecaoEscolaridade, SecaoResumo, TituloSecao } from './Secoes'
import { MapaEscolaridadeIdadeChart }       from '../charts/MapaEscolaridadeIdadeChart'
import { EscolaridadeGeneroComparadaChart } from '../charts/EscolaridadeGeneroComparadaChart'

const RESUMO = indicadores('superior', 'medioOuMais', 'baixa', 'analfabetos', 'hiato', 'nivelComum')

function porGenero(lados) {
  const todas   = lados.flatMap(l => l.perfil.escolaridadeGenero)
  const codigos = [...new Set(todas.map(e => e.codigo))].sort((x, y) => Number(x) - Number(y))

  return lados.map(l => codigos.map(c => (
    l.perfil.escolaridadeGenero.find(e => e.codigo === c)
      ?? { ...todas.find(e => e.codigo === c), M: 0, F: 0 }
  )))
}

export function AbaEscolaridade({ lados, pronto, percentual }) {
  const generos   = pronto ? porGenero(lados) : []
  const celulas   = pronto ? lados.flatMap(l => l.perfil.escolaridadeIdade.flatMap(e => e.celulas)) : []
  const maxGenero = Math.max(...generos.flat().flatMap(e => [e.M, e.F]), 0)
  const maxMapa   = Math.max(...celulas.map(c => c.pct), 0)

  return (
    <>
      <SecaoResumo lados={lados} pronto={pronto} indicadores={RESUMO} />
      <SecaoEscolaridade lados={lados} pronto={pronto} percentual={percentual} />

      <section>
        <TituloSecao
          titulo="Escolaridade × idade"
          subtitulo="% do eleitorado em cada combinação · mesma escala de cor nos dois lados"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lados.map(l => (
            <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={330}>
              {pronto && <MapaEscolaridadeIdadeChart linhas={l.perfil.escolaridadeIdade} maximo={maxMapa} />}
            </CartaoLado>
          ))}
        </div>
      </section>

      <section>
        <TituloSecao
          titulo="Escolaridade × gênero"
          subtitulo="% dentro de cada gênero · o rótulo mostra quem tem mais em cada nível"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lados.map((l, i) => (
            <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={300}>
              {pronto && <EscolaridadeGeneroComparadaChart linhas={generos[i]} maximo={maxGenero} />}
            </CartaoLado>
          ))}
        </div>
      </section>
    </>
  )
}
