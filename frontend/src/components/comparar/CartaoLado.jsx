import { LADOS } from './lados'
import { Skeleton } from '../ui/Primitivas'

export function CartaoLado({ lado, nome, loading, altura = 300, children }) {
  return (
    <div className={`card border-t-2 ${LADOS[lado].borda}`}>
      <p className={`text-xs font-semibold mb-3 ${LADOS[lado].texto}`}>{nome}</p>
      {loading ? <Skeleton altura={altura} /> : children}
    </div>
  )
}
