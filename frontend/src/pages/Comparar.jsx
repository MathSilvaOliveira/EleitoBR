import { useState } from 'react'
import { useComparacao }   from '../hooks/useComparacao'
import { useParametroUrl } from '../hooks/useParametroUrl'
import { CabecalhoPagina } from '../components/CabecalhoPagina'
import { Segmentado }      from '../components/ui/Primitivas'
import { SeletorMunicipios } from '../components/comparar/SeletorMunicipios'
import { Comparacao }        from '../components/comparar/Comparacao'

const ABAS = [
  { valor: 'geral',        rotulo: 'Visão geral' },
  { valor: 'idade',        rotulo: 'Idade' },
  { valor: 'escolaridade', rotulo: 'Escolaridade' },
  { valor: 'social',       rotulo: 'Perfil social' },
]

const ABAS_ATIVAS = ABAS.filter(o => !o.desabilitado).map(o => o.valor)

const ESCALAS = [
  { valor: 'percentual', rotulo: '%' },
  { valor: 'absoluto',   rotulo: 'Nº de eleitores' },
]

const BOTAO = `text-sm px-4 py-2 rounded-lg font-medium border transition-colors
               bg-white border-gray-300 text-gray-700 hover:bg-gray-100
               dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`

export function Comparar({ navegar }) {
  const { a, b, escolher, trocar } = useComparacao()
  const [escala, setEscala] = useParametroUrl('escala', 'percentual', ESCALAS.map(e => e.valor))
  const [aba, setAba] = useParametroUrl('aba', 'geral', ABAS_ATIVAS, { navega: true })

  return (
    <>
      <CabecalhoPagina
        caminho={[{ rotulo: 'Painel geral', para: '/' }, { rotulo: 'Comparar municípios' }]}
        titulo="Comparar municípios"
        subtitulo="Dois municípios lado a lado, sempre na mesma escala"
        navegar={navegar}
      >
        <button type="button" onClick={() => navegar('/')} className={BOTAO}>
          ← Voltar ao painel
        </button>
        <CopiarLink />
      </CabecalhoPagina>

      <section className="space-y-4">
        <SeletorMunicipios a={a} b={b} aoEscolher={escolher} aoTrocar={trocar} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmentado rotulo="Aspecto comparado" opcoes={ABAS} valor={aba} aoMudar={setAba} />
          <Segmentado rotulo="Unidade" opcoes={ESCALAS} valor={escala} aoMudar={setEscala} />
        </div>
      </section>

      {a && b
        ? <Comparacao a={a} b={b} aba={aba} percentual={escala === 'percentual'} />
        : (
          <div className="card text-center py-16 text-sm text-gray-500 dark:text-gray-400">
            Escolha os dois municípios acima para ver a comparação.
          </div>
        )}
    </>
  )
}

function CopiarLink() {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
      })
      .catch(() => {})
  }

  return (
    <button type="button" onClick={copiar} className={BOTAO}>
      {copiado ? '✓ Link copiado' : 'Copiar link'}
    </button>
  )
}
