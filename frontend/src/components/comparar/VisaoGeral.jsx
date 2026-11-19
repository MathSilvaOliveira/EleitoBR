import { CartaoLado }  from './CartaoLado'
import { indicadores } from './indicadores'
import { SecaoEscolaridade, SecaoPiramide, SecaoResumo, TituloSecao } from './Secoes'
import { GeneroChart } from '../charts/GeneroChart'

const RESUMO = indicadores('total', 'iee', 'hiato', 'mulheres', 'mediana', 'superior')

export function VisaoGeral({ lados, pronto, percentual }) {
  return (
    <>
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

      <SecaoEscolaridade lados={lados} pronto={pronto} percentual={percentual} />
    </>
  )
}
