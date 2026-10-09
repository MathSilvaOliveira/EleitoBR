export function numeroCompacto(n) {
  if (n == null) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1).replace('.', ',')} mil`
  return n.toLocaleString('pt-BR')
}

export function numeroPtBR(n) {
  return n != null ? n.toLocaleString('pt-BR') : '—'
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
