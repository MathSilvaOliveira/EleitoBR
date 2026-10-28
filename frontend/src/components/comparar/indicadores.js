import {
  numeroPtBR, decimalPtBR, percentualPtBR, comSinal,
} from '../../utils/formatos'

const emPontos = (v, o) => `${comSinal(v - o)} p.p. vs outro`

const INDICADORES = {
  total: {
    titulo:    'Eleitores',
    formato:   numeroPtBR,
    diferenca: (v, o) => (v >= o
      ? `${decimalPtBR(v / o, v / o >= 10 ? 0 : 1)}× o outro`
      : `${percentualPtBR((v / o) * 100, v / o >= 0.1 ? 0 : 2)} do outro`),
  },
  iee: {
    titulo:    'IEE',
    formato:   v => decimalPtBR(v, 2),
    diferenca: (v, o) => `${comSinal(v - o, 2)} vs outro`,
  },
  hiato: {
    titulo:    'Hiato (p.p.)',
    formato:   comSinal,
    diferenca: emPontos,
  },
  mulheres: {
    titulo:    'Mulheres',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  mediana: {
    titulo:    'Idade mediana',
    formato:   v => `${decimalPtBR(v)} anos`,
    diferenca: (v, o) => `${comSinal(v - o)} anos vs outro`,
  },
  superior: {
    titulo:    'Superior completo',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  faixaMaior: {
    titulo:    'Faixa mais numerosa',
    formato:   v => `${v} anos`,
    diferenca: (v, o) => `outro: ${o} anos`,
    selo:      false,
  },
  jovens: {
    titulo:    'Até 24 anos',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  idosos: {
    titulo:    '60 ou mais',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  facultativo: {
    titulo:    'Voto facultativo',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  medioOuMais: {
    titulo:    'Médio completo+',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  baixa: {
    titulo:    'Baixa instrução',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  analfabetos: {
    titulo:    'Analfabetos',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  nivelComum: {
    titulo:    'Nível mais comum',
    formato:   v => v,
    diferenca: (v, o) => `outro: ${o}`,
    selo:      false,
    texto:     true,
  },
  casados: {
    titulo:    'Casados',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  declararamRaca: {
    titulo:    'Declararam raça/cor',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  quilombolas: {
    titulo:    'Quilombolas',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  deficiencia: {
    titulo:    'Com deficiência',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
  nomeSocial: {
    titulo:    'Nome social',
    formato:   v => percentualPtBR(v, 2),
    diferenca: (v, o) => `${comSinal(v - o, 2)} p.p. vs outro`,
  },
  biometria: {
    titulo:    'Com biometria',
    formato:   percentualPtBR,
    diferenca: emPontos,
  },
}

export const indicadores = (...chaves) => chaves.map(chave => ({ chave, ...INDICADORES[chave] }))
