import { numeroPtBR } from '../../utils/formatos'

/**
 * Tooltip que acrescenta o total da categoria às séries do gráfico.
 *
 * Os valores entram em módulo porque na pirâmide etária um dos lados é
 * guardado negativo para ser desenhado à esquerda: somar direto daria a
 * diferença entre os sexos, não o total da faixa.
 *
 * `ordem` fixa a sequência das linhas para casar com a legenda. Sem ela o
 * Recharts ordena por valor, e as linhas trocam de lugar de uma categoria
 * para outra — o que atrapalha justamente a comparação que o tooltip serve.
 */
export function TooltipTotal({ active, payload, label, paleta, ordem = [] }) {
  if (!active || !payload?.length) return null

  const posicao = nome => {
    const i = ordem.indexOf(nome)
    return i === -1 ? ordem.length : i
  }

  const itens = payload
    .map(p => ({
      nome:  p.name,
      cor:   p.color ?? p.fill,
      valor: Math.abs(p.value ?? 0),
    }))
    .sort((a, b) => posicao(a.nome) - posicao(b.nome))

  const total = itens.reduce((soma, i) => soma + i.valor, 0)
  const linha = { margin: 0, lineHeight: 1.6 }

  return (
    <div
      style={{
        backgroundColor: paleta.tooltipBg,
        border: `1px solid ${paleta.borda}`,
        borderRadius: 8,
        color: paleta.tooltipTxt,
        padding: '8px 12px',
        fontSize: 13,
      }}
    >
      <p style={{ ...linha, fontWeight: 600, marginBottom: 4 }}>{label}</p>

      {itens.map(i => (
        <p key={i.nome} style={{ ...linha, color: i.cor }}>
          {i.nome} : {numeroPtBR(i.valor)}
        </p>
      ))}

      <p
        style={{
          ...linha,
          marginTop: 4,
          paddingTop: 4,
          borderTop: `1px solid ${paleta.borda}`,
          fontWeight: 600,
        }}
      >
        Total : {numeroPtBR(total)}
      </p>
    </div>
  )
}
