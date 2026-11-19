import { indicadores } from './indicadores'
import { SecaoBarras, SecaoResumo } from './Secoes'
import { rotuloEstadoCivil, rotuloRacaCor } from '../../utils/formatos'

const RESUMO = indicadores('casados', 'declararamRaca', 'quilombolas', 'deficiencia', 'nomeSocial', 'biometria')

export function AbaPerfilSocial({ lados, pronto, percentual }) {
  if (pronto && lados.some(l => l.perfil.total === 0)) {
    return (
      <div className="card text-center py-16 text-sm text-gray-500 dark:text-gray-400">
        Ainda não há dados de perfil social carregados para estes municípios.
      </div>
    )
  }

  return (
    <>
      <SecaoResumo
        lados={lados}
        pronto={pronto}
        indicadores={RESUMO}
        subtitulo="o selo indica o maior valor · quilombolas: % entre quem respondeu"
      />

      <SecaoBarras
        titulo="Estado civil"
        subtitulo="barra = este município · traço = o outro, na mesma escala"
        lados={lados}
        pronto={pronto}
        percentual={percentual}
        categorias={perfil => perfil.estadoCivil}
        base={perfil => perfil.total}
        rotulo={rotuloEstadoCivil}
        altura={160}
        ordenadas={false}
      />

      <SecaoBarras
        titulo="Raça/cor declarada"
        subtitulo="só quem declarou · a autodeclaração ainda é opcional no cadastro"
        lados={lados}
        pronto={pronto}
        percentual={percentual}
        categorias={perfil => perfil.racaCor}
        base={perfil => perfil.declarados}
        rotulo={rotuloRacaCor}
        altura={160}
        ordenadas={false}
      />
    </>
  )
}
