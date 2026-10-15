import { useState } from 'react'
import { useTema } from '../../context/TemaContext'

export function InfoTooltip({ texto }) {
  const [aberto, setAberto] = useState(false)

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="Sobre este gráfico"
        className="w-5 h-5 rounded-full text-[11px] font-bold leading-none
                   bg-gray-200 text-gray-600 hover:bg-gray-300
                   dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600
                   flex items-center justify-center cursor-help"
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
      >
        i
      </button>
      {aberto && (
        <span
          role="tooltip"
          className="absolute z-20 top-7 right-0 w-72 text-xs leading-relaxed
                     rounded-lg shadow-lg p-3
                     bg-gray-900 text-gray-100 dark:bg-gray-950
                     border border-gray-700"
        >
          {texto}
        </span>
      )}
    </span>
  )
}

export function Skeleton({ altura = 420 }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/50"
      style={{ height: altura }}
      aria-busy="true"
      aria-label="Carregando dados"
    />
  )
}

export function ErroCarga({ mensagem, altura = 420 }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg
                 border border-dashed border-red-300 dark:border-red-800
                 text-red-600 dark:text-red-400 text-sm"
      style={{ height: altura }}
      role="alert"
    >
      <span className="font-semibold">Falha ao carregar dados</span>
      <span className="text-xs opacity-80">{mensagem}</span>
    </div>
  )
}

/**
 * Container padrão de gráfico.
 * @param {{ titulo: string, subtitulo?: string, info?: string,
 *           loading?: boolean, error?: string|null, altura?: number,
 *           children: React.ReactNode }} props
 */
export function ChartCard({ titulo, subtitulo, info, loading, error, altura = 420, children }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="chart-title">{titulo}</p>
          {subtitulo && <p className="chart-subtitle">{subtitulo}</p>}
        </div>
        {info && <InfoTooltip texto={info} />}
      </div>

      {error   ? <ErroCarga mensagem={error} altura={altura} />
       : loading ? <Skeleton altura={altura} />
       : children}
    </div>
  )
}

/** Link entre telas: troca pela History API, mas ctrl/cmd+clique ainda abre outra aba. */
export function LinkTela({ para, navegar, children, ...resto }) {
  function aoClicar(e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return
    e.preventDefault()
    navegar(para)
  }

  return <a href={para} onClick={aoClicar} {...resto}>{children}</a>
}

/** Grupo de botões de escolha única (abas, unidade de medida). */
export function Segmentado({ opcoes, valor, aoMudar, rotulo }) {
  return (
    <div
      role="group"
      aria-label={rotulo}
      className="inline-flex max-w-full overflow-x-auto gap-1 rounded-lg p-1 border
                 bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
    >
      {opcoes.map(o => (
        <button
          key={o.valor}
          type="button"
          aria-pressed={valor === o.valor}
          aria-disabled={o.desabilitado || undefined}
          title={o.desabilitado ? 'Em breve' : undefined}
          onClick={() => !o.desabilitado && aoMudar?.(o.valor)}
          className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors
            ${valor === o.valor
              ? 'font-medium bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
              : o.desabilitado
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'}`}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

/** Botão de alternância claro/escuro. */
export function ThemeToggle() {
  const { tema, alternar } = useTema()

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="rounded-full w-9 h-9 flex items-center justify-center text-lg
                 bg-white/10 hover:bg-white/20 transition-colors"
      title={tema === 'dark' ? 'Modo claro' : 'Modo escuro'}
    >
      {tema === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
