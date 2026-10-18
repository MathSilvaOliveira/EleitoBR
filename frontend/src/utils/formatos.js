export function numeroCompacto(n) {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1).replace('.', ',')} mil`
  return n.toLocaleString('pt-BR')
}

export function numeroPtBR(n) {
  return n != null ? n.toLocaleString('pt-BR') : '—'
}

export function decimalPtBR(n, casas = 1) {
  if (n == null) return '—'
  return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

export function percentualPtBR(n, casas = 1) {
  return n != null ? `${decimalPtBR(n, casas)}%` : '—'
}

// Sinal explícito nos dois sentidos, com o menos tipográfico (−).
export function comSinal(n, casas = 1) {
  if (n == null) return '—'
  const valor = decimalPtBR(Math.abs(n), casas)
  if (Math.round(Math.abs(n) * 10 ** casas) === 0) return valor
  return `${n > 0 ? '+' : '−'}${valor}`
}

const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

// O TSE grava os nomes em caixa alta; em frase, só as iniciais.
export function nomeProprio(nome) {
  if (!nome) return nome
  return nome
    .toLowerCase()
    .split(' ')
    .map((p, i) => (i > 0 && PARTICULAS.has(p)
      ? p
      : p.replace(/(^|[-'])(\p{L})/gu, (_, sep, letra) => sep + letra.toUpperCase())))
    .join(' ')
}

export const ESCOLARIDADE_ABREV = {
  'ANALFABETO':                    'Analfabeto',
  'LÊ E ESCREVE':                  'Lê e escreve',
  'ENSINO FUNDAMENTAL INCOMPLETO': 'Fund. incompleto',
  'ENSINO FUNDAMENTAL COMPLETO':   'Fund. completo',
  'ENSINO MÉDIO INCOMPLETO':       'Médio incompleto',
  'ENSINO MÉDIO COMPLETO':         'Médio completo',
  'SUPERIOR INCOMPLETO':           'Sup. incompleto',
  'SUPERIOR COMPLETO':             'Sup. completo',
  'NÃO INFORMADO':                 'Não informado',
}

export function abreviaEscolaridade(descricao) {
  return ESCOLARIDADE_ABREV[descricao?.toUpperCase()] ?? descricao
}

const BUCKETS = [
  { rotulo: '16–17', min: 16, max: 17 },
  { rotulo: '18–24', min: 18, max: 24 },
  { rotulo: '25–34', min: 25, max: 34 },
  { rotulo: '35–44', min: 35, max: 44 },
  { rotulo: '45–59', min: 45, max: 59 },
  { rotulo: '60–74', min: 60, max: 74 },
  { rotulo: '75+',   min: 75, max: 200 },
]

export const BUCKETS_ROTULOS = BUCKETS.map(b => b.rotulo)

export function bucketFaixa(codigo) {
  const n = Number(codigo)
  if (!Number.isFinite(n) || n <= 0) return null
  const idadeInicial = Math.floor(n / 100)
  const b = BUCKETS.find(b => idadeInicial >= b.min && idadeInicial <= b.max)
  return b?.rotulo ?? null
}

// Código do TSE: 1600 = 16 anos, 2124 = 21 a 24 anos, 9999 = 100 anos ou mais.
// O fim é exclusivo; a faixa aberta de 100+ recebe largura nominal de 5 anos.
export function limitesFaixa(codigo) {
  const n = Number(codigo)
  if (n === 9999) return { inicio: 100, fim: 105 }
  const inicio = Math.floor(n / 100)
  return { inicio, fim: (n % 100 || inicio) + 1 }
}

// Faixas da pirâmide comparada; 15–17 inclui os alistados aos 15 anos.
const FAIXAS_PIRAMIDE = [
  { rotulo: '15–17', min: 15, max: 17 },
  { rotulo: '18–19', min: 18, max: 19 },
  ...Array.from({ length: 14 }, (_, i) => {
    const min = 20 + i * 5
    return { rotulo: `${min}–${min + 4}`, min, max: min + 4 }
  }),
  { rotulo: '90+', min: 90, max: 200 },
]

export function agruparFaixasPiramide(linhas) {
  const grupos = FAIXAS_PIRAMIDE.map(f => ({
    codigo: String(f.min * 100), descricao: f.rotulo, M: 0, F: 0, NI: 0,
  }))

  for (const l of linhas) {
    if (Number(l.codigo) <= 0) continue
    const { inicio } = limitesFaixa(l.codigo)
    const i = FAIXAS_PIRAMIDE.findIndex(f => inicio >= f.min && inicio <= f.max)
    if (i === -1) continue
    grupos[i].M  += l.M
    grupos[i].F  += l.F
    grupos[i].NI += l.NI
  }

  return grupos
}

export const GENERO_ROTULO = { F: 'Feminino', M: 'Masculino', NI: 'Não informado' }

export function dataPtBR(iso) {
  return iso ? new Date(iso).toLocaleDateString('pt-BR') : '—'
}

export function tamanhoArquivo(bytes) {
  if (bytes == null) return '—'
  const gb = bytes / 1_000_000_000
  if (gb >= 1) return `${gb.toFixed(1).replace('.', ',')} GB`
  return `${(bytes / 1_000_000).toFixed(0)} MB`
}

// Sequência das legendas dos gráficos de gênero, usada para ordenar o tooltip.
export const ORDEM_GENERO = ['Feminino', 'Masculino', 'Não inf.', 'Não informado']
