import prisma from '../src/lib/prisma.js'

/**
 * Massa de teste pequena e de números redondos, para que todo valor esperado
 * nos testes possa ser conferido à mão.
 *
 *  ALFA   (SP) total 1000 | jovens  200, idosos 600 → IEE 3.00 | baixa  200, sup 600 → hiato -40.0
 *  BETA   (SP) total 2000 | jovens  800, idosos 400 → IEE 0.50 | baixa 1200, sup 800 → hiato +20.0
 *  GAMA   (RJ) total  500 | jovens    0, idosos   0 → IEE nulo | baixa    0, sup   0 → hiato   0.0
 *  LISBOA (ZZ) total 1000 — exterior, fora dos agregados nacionais
 */
export const ESPERADO = {
  totalBrasil:     3500,
  totalExterior:   1000,
  totalMunicipios: 3,
  totalEstados:    2,
  brasilF:         2150,
  brasilM:         1350,
  spTotal:         3000,
  spF:             1900,
  rjTotal:         500,
  rjF:             250,
}

function travaDeSeguranca() {
  const url = process.env.DATABASE_URL ?? ''
  if (!/_test(\?|$)/.test(url)) {
    throw new Error(
      `Seed recusado: DATABASE_URL precisa apontar para um banco terminado em "_test". Recebido: ${url || '(vazio)'}`,
    )
  }
}

export async function seed() {
  travaDeSeguranca()

  await prisma.importacao.deleteMany()
  await prisma.eleitoradoPerfil.deleteMany()
  await prisma.municipio.deleteMany()
  await prisma.faixaEtaria.deleteMany()
  await prisma.escolaridade.deleteMany()

  const alfa   = await prisma.municipio.create({ data: { codigo: '0001', nome: 'ALFA',   uf: 'SP' } })
  const beta   = await prisma.municipio.create({ data: { codigo: '0002', nome: 'BETA',   uf: 'SP' } })
  const gama   = await prisma.municipio.create({ data: { codigo: '0003', nome: 'GAMA',   uf: 'RJ' } })
  const lisboa = await prisma.municipio.create({ data: { codigo: '9999', nome: 'LISBOA', uf: 'ZZ' } })

  // Códigos de faixa seguem a convenção do TSE usada pelo IEE:
  // 1600–2124 = jovens, >= 6064 = idosos.
  const jovem = await prisma.faixaEtaria.create({ data: { codigo: '1800', descricao: '18 anos' } })
  const meia  = await prisma.faixaEtaria.create({ data: { codigo: '3034', descricao: '30 a 34 anos' } })
  const idoso = await prisma.faixaEtaria.create({ data: { codigo: '6064', descricao: '60 a 64 anos' } })

  // Códigos de escolaridade usados pelo Hiato: 1,2,3 = baixa | 7,8 = superior.
  const baixa = await prisma.escolaridade.create({ data: { codigo: '1', descricao: 'ANALFABETO' } })
  const media = await prisma.escolaridade.create({ data: { codigo: '5', descricao: 'ENSINO MÉDIO INCOMPLETO' } })
  const sup   = await prisma.escolaridade.create({ data: { codigo: '8', descricao: 'SUPERIOR COMPLETO' } })

  const perfis = [
    [alfa,   jovem, baixa, 'M', 100],
    [alfa,   jovem, baixa, 'F', 100],
    [alfa,   idoso, sup,   'M', 300],
    [alfa,   idoso, sup,   'F', 300],
    [alfa,   meia,  media, 'M', 100],
    [alfa,   meia,  media, 'F', 100],

    [beta,   jovem, baixa, 'M', 400],
    [beta,   jovem, baixa, 'F', 400],
    [beta,   idoso, baixa, 'M', 200],
    [beta,   idoso, baixa, 'F', 200],
    [beta,   meia,  sup,   'F', 800],

    [gama,   meia,  media, 'M', 250],
    [gama,   meia,  media, 'F', 250],

    [lisboa, meia,  media, 'M', 300],
    [lisboa, meia,  media, 'F', 700],
  ]

  await prisma.eleitoradoPerfil.createMany({
    data: perfis.map(([municipio, faixa, escolaridade, genero, quantidade]) => ({
      municipioId:    municipio.id,
      faixaEtariaId:  faixa.id,
      escolaridadeId: escolaridade.id,
      genero,
      zona:           '0001',
      quantidade,
    })),
  })

  return { alfa, beta, gama, lisboa }
}
