import { Skeleton }        from '../ui/Primitivas'
import { CartaoLado }      from './CartaoLado'
import { FraseComparacao } from './FraseComparacao'
import { indicadores }     from './indicadores'
import { SecaoPiramide, SecaoResumo, TituloSecao } from './Secoes'
import { GeneroChart }                from '../charts/GeneroChart'
import { EscolaridadeComparadaChart } from '../charts/EscolaridadeComparadaChart'
import { abreviaEscolaridade } from '../../utils/formatos'

const RESUMO = indicadores('total', 'iee', 'hiato', 'mulheres', 'mediana', 'superior')

function escolaridade(perfil, codigo, percentual) {
  const total = perfil.escolaridade.find(e => e.codigo === codigo)?.total ?? 0
  return percentual ? (total / perfil.total) * 100 : total
}

export function VisaoGeral({ lados, pronto, percentual }) {
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

      <SecaoResumo lados={lados} pronto={pronto} indicadores={RESUMO} />
      <SecaoPiramide lados={lados} pronto={pronto} percentual={percentual} />

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
