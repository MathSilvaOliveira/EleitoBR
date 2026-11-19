import { usePerfilMunicipio } from '../../hooks/usePerfilMunicipio'
import { usePerfilSocial }    from '../../hooks/usePerfilSocial'
import { ErroCarga }       from '../ui/Primitivas'
import { VisaoGeral }      from './VisaoGeral'
import { AbaIdade }        from './AbaIdade'
import { AbaEscolaridade } from './AbaEscolaridade'
import { AbaPerfilSocial } from './AbaPerfilSocial'
import { nomeProprio } from '../../utils/formatos'

export function Comparacao({ a, b, aba, percentual }) {
  const perfilA = usePerfilMunicipio(a.id)
  const perfilB = usePerfilMunicipio(b.id)
  const socialA = usePerfilSocial(a.id)
  const socialB = usePerfilSocial(b.id)

  // O perfil social vem de outra tabela: uma falha nele não derruba as demais abas.
  const [dadosA, dadosB] = aba === 'social' ? [socialA, socialB] : [perfilA, perfilB]

  const error = dadosA.error ?? dadosB.error
  if (error) return <ErroCarga mensagem={error} altura={240} />

  const pronto = Boolean(dadosA.perfil && dadosB.perfil)

  const lados = [
    { lado: 'a', municipio: a, perfil: dadosA.perfil, outro: dadosB.perfil },
    { lado: 'b', municipio: b, perfil: dadosB.perfil, outro: dadosA.perfil },
  ].map(l => ({
    ...l,
    nome:   nomeProprio(l.municipio.nome) ?? '…',
    rotulo: l.municipio.nome ? `${nomeProprio(l.municipio.nome)} – ${l.municipio.uf}` : '…',
  }))

  if (aba === 'idade')        return <AbaIdade lados={lados} pronto={pronto} percentual={percentual} />
  if (aba === 'escolaridade') return <AbaEscolaridade lados={lados} pronto={pronto} percentual={percentual} />
  if (aba === 'social')       return <AbaPerfilSocial lados={lados} pronto={pronto} percentual={percentual} />
  return <VisaoGeral lados={lados} pronto={pronto} percentual={percentual} />
}
