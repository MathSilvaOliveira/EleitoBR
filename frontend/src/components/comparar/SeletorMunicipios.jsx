import { LADOS } from './lados'
import { BuscaMunicipio } from '../BuscaMunicipio'
import { nomeProprio } from '../../utils/formatos'

export function SeletorMunicipios({ a, b, aoEscolher, aoTrocar }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] md:items-end gap-3">
      <Campo lado="a" municipio={a} outro={b} aoEscolher={m => aoEscolher('a', m)} />

      <button
        type="button"
        onClick={aoTrocar}
        disabled={!a || !b}
        aria-label="Trocar os municípios A e B"
        title="Trocar A e B"
        className="justify-self-center md:mb-1 w-9 h-9 rounded-full border text-base
                   bg-white border-gray-300 text-gray-600 hover:bg-gray-100
                   dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300
                   dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
      >
        ⇄
      </button>

      <Campo lado="b" municipio={b} outro={a} aoEscolher={m => aoEscolher('b', m)} />
    </div>
  )
}

function Campo({ lado, municipio, outro, aoEscolher }) {
  const l = LADOS[lado]

  return (
    <div>
      <p className="flex items-center gap-2 mb-1.5 text-[11px] font-medium uppercase
                    tracking-wide text-gray-500 dark:text-gray-400">
        <span className={`w-5 h-0.5 rounded ${l.linha}`} />
        {l.rotulo}
      </p>
      <BuscaMunicipio
        placeholder="Buscar município…"
        rotulo={municipio?.nome ? nomeProprio(municipio.nome) : undefined}
        ignorar={outro?.id}
        aoEscolher={aoEscolher}
        grande
        className={`w-full border-l-4 ${l.campo} pr-24`}
      >
        {municipio && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {municipio.uf && (
              <span className="text-[11px] px-1.5 py-0.5 rounded
                               bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {municipio.uf === 'ZZ' ? 'Exterior' : municipio.uf}
              </span>
            )}
            <button
              type="button"
              onClick={() => aoEscolher(null)}
              aria-label={`Limpar ${l.rotulo.toLowerCase()}`}
              title="Limpar"
              className="w-6 h-6 rounded-full text-xs text-gray-400 hover:text-gray-700
                         hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        )}
      </BuscaMunicipio>
    </div>
  )
}
