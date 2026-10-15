import { useApi }      from '../hooks/useApi'
import { ThemeToggle } from './ui/Primitivas'
import { dataPtBR }    from '../utils/formatos'

const TELAS = [
  { caminho: '/',         rotulo: 'Painel geral' },
  { caminho: '/comparar', rotulo: 'Comparar' },
]

export function Cabecalho({ rota, navegar }) {
  function aoClicar(e, caminho) {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return
    e.preventDefault()
    navegar(caminho)
  }

  return (
    <header className="bg-blue-900 dark:bg-gray-950 text-white shadow-md
                       border-b border-blue-950 dark:border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-8 h-16
                      flex items-center gap-4 sm:gap-10">

        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-blue-600
                           flex items-center justify-center" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"
                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M7 17v-5M12 17V7M17 17v-8" />
            </svg>
          </span>
          <div className="hidden sm:block leading-tight">
            <p className="font-bold tracking-tight">EleitoBR</p>
            <p className="text-xs text-blue-300 dark:text-gray-400">Perfil do eleitorado</p>
          </div>
        </div>

        <nav aria-label="Telas" className="flex self-stretch gap-2">
          {TELAS.map(t => (
            <a
              key={t.caminho}
              href={t.caminho}
              onClick={e => aoClicar(e, t.caminho)}
              aria-current={rota === t.caminho ? 'page' : undefined}
              className={`flex items-center px-3 text-sm font-medium
                          border-b-2 transition-colors
                ${rota === t.caminho
                  ? 'border-blue-400 dark:border-blue-500 text-white'
                  : `border-transparent text-blue-200 hover:text-white
                     dark:text-gray-400 dark:hover:text-gray-100`}`}
            >
              {t.rotulo}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <BaseTse />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function BaseTse() {
  const { data } = useApi('/api/importacao')

  if (!data) return null

  return (
    <span className="hidden md:flex items-center gap-2 text-xs
                     text-blue-200 dark:text-gray-400">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      Base TSE · {dataPtBR(data.baixado_em)}
    </span>
  )
}
