import { usePerfilMunicipio } from '../../hooks/usePerfilMunicipio'
import { ErroCarga }       from '../ui/Primitivas'
import { VisaoGeral }      from './VisaoGeral'
import { AbaIdade }        from './AbaIdade'
import { AbaEscolaridade } from './AbaEscolaridade'
import { nomeProprio } from '../../utils/formatos'

export function Comparacao({ a, b, aba, percentual }) {
  const perfilA = usePerfilMunicipio(a.id)
  const perfilB = usePerfilMunicipio(b.id)

  const error = perfilA.error ?? perfilB.error
  if (error) return <ErroCarga mensagem={error} altura={240} />

  const pronto = Boolean(perfilA.perfil && perfilB.perfil)

  const lados = [
    { lado: 'a', municipio: a, perfil: perfilA.perfil, outro: perfilB.perfil },
    { lado: 'b', municipio: b, perfil: perfilB.perfil, outro: perfilA.perfil },
  ].map(l => ({
    ...l,
    nome:   nomeProprio(l.municipio.nome) ?? '…',
    rotulo: l.municipio.nome ? `${nomeProprio(l.municipio.nome)} – ${l.municipio.uf}` : '…',
  }))

  if (aba === 'idade')        return <AbaIdade lados={lados} pronto={pronto} percentual={percentual} />
  if (aba === 'escolaridade') return <AbaEscolaridade lados={lados} pronto={pronto} percentual={percentual} />
  return <VisaoGeral lados={lados} pronto={pronto} percentual={percentual} />
}
