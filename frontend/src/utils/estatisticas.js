import { limitesFaixa } from './formatos'

// Topo e marcas de eixo em passos redondos (1, 2, 2,5 ou 5 × potência de 10).
export function escalaLinear(maximo, partes) {
  const bruto  = Math.max(maximo, 1e-9) / partes
  const ordem  = 10 ** Math.floor(Math.log10(bruto))
  const passo  = [1, 2, 2.5, 5, 10].map(m => m * ordem).find(p => p >= bruto)
  const topo   = Math.ceil(maximo / passo) * passo || passo
  const marcas = Array.from({ length: Math.round(topo / passo) + 1 }, (_, i) => i * passo)
  return { topo, marcas }
}

// Mediana de dados agrupados, interpolada dentro da faixa (método no README).
export function idadeMediana(faixas) {
  const validas = faixas
    .filter(f => Number(f.codigo) > 0)
    .sort((a, b) => Number(a.codigo) - Number(b.codigo))

  const total = validas.reduce((soma, f) => soma + f.total, 0)
  if (total === 0) return null

  const metade = total / 2
  let acumulado = 0

  for (const f of validas) {
    if (acumulado + f.total >= metade) {
      const { inicio, fim } = limitesFaixa(f.codigo)
      return inicio + ((metade - acumulado) / f.total) * (fim - inicio)
    }
    acumulado += f.total
  }

  return null
}
