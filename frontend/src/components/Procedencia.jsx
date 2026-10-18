import { useApi }  from '../hooks/useApi'
import { dataPtBR, tamanhoArquivo } from '../utils/formatos'

/**
 * O TSE republica o perfil do eleitorado sempre sob o mesmo nome, então os
 * números desta tela só são reproduzíveis se o recorte estiver identificado.
 * Daí exibir tamanho, data e hash do arquivo de origem.
 */
export function Procedencia() {
  const { data } = useApi('/api/importacao')

  if (!data) return null

  return (
    <p className="mt-2">
      Recorte dos dados: <span className="font-mono">{data.arquivo}</span>
      {' · '}{tamanhoArquivo(data.bytes)}
      {' · '}arquivo de {dataPtBR(data.baixado_em)}
      {' · '}carregado em {dataPtBR(data.carregado_em)}
      <br />
      <span className="font-mono" title={data.sha256}>
        SHA-256 {data.sha256.slice(0, 16)}…
      </span>
    </p>
  )
}
