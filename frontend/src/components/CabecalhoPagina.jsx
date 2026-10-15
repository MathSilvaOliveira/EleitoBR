import { LinkTela } from './ui/Primitivas'

export function CabecalhoPagina({ caminho = [], titulo, subtitulo, navegar, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <nav aria-label="Caminho"
             className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          {caminho.map((c, i) => (
            <span key={c.rotulo} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">›</span>}
              {c.para
                ? (
                  <LinkTela para={c.para} navegar={navegar}
                            className="hover:text-gray-900 dark:hover:text-gray-100">
                    {c.rotulo}
                  </LinkTela>
                )
                : <span className="text-gray-700 dark:text-gray-200">{c.rotulo}</span>}
            </span>
          ))}
        </nav>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitulo}</p>
        )}
      </div>

      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
