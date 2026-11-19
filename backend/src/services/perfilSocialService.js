import prisma from '../lib/prisma.js'
import { buildPerfilWhere } from '../lib/queryFilters.js'

export async function getPerfilSocial(filters = {}) {
  const where = buildPerfilWhere(filters)

  const [somas, porEstadoCivil, porRacaCor, porQuilombola, estadosCivis, racasCores] =
    await Promise.all([
      prisma.perfilSocial.aggregate({
        _sum:  { quantidade: true, comBiometria: true, comDeficiencia: true, comNomeSocial: true },
        where,
      }),
      prisma.perfilSocial.groupBy({ by: ['estadoCivilId'], _sum: { quantidade: true }, where }),
      prisma.perfilSocial.groupBy({ by: ['racaCorId'],     _sum: { quantidade: true }, where }),
      prisma.perfilSocial.groupBy({ by: ['quilombola'],    _sum: { quantidade: true }, where }),
      prisma.estadoCivil.findMany(),
      prisma.racaCor.findMany(),
    ])

  const quilombola = { S: 0, N: 0, NI: 0 }
  for (const row of porQuilombola) quilombola[row.quilombola] = row._sum.quantidade ?? 0

  return {
    total:          somas._sum.quantidade     ?? 0,
    comBiometria:   somas._sum.comBiometria   ?? 0,
    comDeficiencia: somas._sum.comDeficiencia ?? 0,
    comNomeSocial:  somas._sum.comNomeSocial  ?? 0,
    quilombola,
    estadoCivil: distribuicao(porEstadoCivil, 'estadoCivilId', estadosCivis),
    racaCor:     distribuicao(porRacaCor, 'racaCorId', racasCores),
  }
}

function distribuicao(rows, campo, dimensoes) {
  const dimMap = new Map(dimensoes.map(d => [d.id, d]))

  return rows
    .map(row => ({
      codigo:    dimMap.get(row[campo])?.codigo    ?? String(row[campo]),
      descricao: dimMap.get(row[campo])?.descricao ?? 'Desconhecida',
      total:     row._sum.quantidade ?? 0,
    }))
    .sort((a, b) => Number(a.codigo) - Number(b.codigo))
}
