import { Skeleton }    from '../ui/Primitivas'
import { LADOS }       from './lados'
import { CartaoLado }  from './CartaoLado'
import { FraseIdade }  from './FraseComparacao'
import { indicadores } from './indicadores'
import { SecaoPiramide, SecaoResumo, TituloSecao } from './Secoes'
import { GeracoesChart }    from '../charts/GeracoesChart'
import { FaixaAFaixaChart } from '../charts/FaixaAFaixaChart'

const RESUMO = indicadores('mediana', 'faixaMaior', 'jovens', 'idosos', 'iee', 'facultativo')

function faixas(perfil, outro, percentual) {
  const valor = (p, i) => {
    const f = p.piramide[i]
    const total = f.M + f.F + f.NI
    return percentual ? (total / p.comIdade) * 100 : total
  }

  return perfil.piramide.map((f, i) => ({
    faixa: f.descricao,
    valor: valor(perfil, i),
    outro: valor(outro, i),
  }))
}

export function AbaIdade({ lados, pronto, percentual }) {
  const linhas = pronto ? lados.map(l => faixas(l.perfil, l.outro, percentual)) : []
  const maximo = Math.max(...linhas.flat().flatMap(f => [f.valor, f.outro]), 0)

  return (
    <>
      {pronto
        ? <FraseIdade a={lados[0]} b={lados[1]} />
        : <Skeleton altura={72} />}

      <SecaoResumo lados={lados} pronto={pronto} indicadores={RESUMO} />

      <section>
        <TituloSecao
          titulo="Gerações"
          subtitulo="participação de cada grupo de idade · idade mediana em destaque"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lados.map(l => (
            <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={140}>
              {pronto && <GeracoesChart geracoes={l.perfil.geracoes} mediana={l.perfil.mediana} />}
            </CartaoLado>
          ))}
        </div>
      </section>

      <SecaoPiramide lados={lados} pronto={pronto} percentual={percentual} />

      <section>
        <TituloSecao
          titulo="Faixa a faixa"
          subtitulo={`${percentual ? '% do eleitorado' : 'eleitores'} em cada faixa, os dois gêneros · 15–17 e 18–19 cobrem menos anos`}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {lados.map((l, i) => (
            <CartaoLado key={l.lado} lado={l.lado} nome={l.rotulo} loading={!pronto} altura={260}>
              {pronto && (
                <FaixaAFaixaChart
                  linhas={linhas[i]}
                  maximo={maximo}
                  percentual={percentual}
                  cor={LADOS[l.lado].cor}
                  corOutro={LADOS[lados[1 - i].lado].cor}
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
