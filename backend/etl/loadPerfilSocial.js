/**
 * ETL — Perfil social (EleitoBR)
 *
 * Carga complementar à de etl/load.js, sobre o mesmo CSV do TSE. A carga
 * principal soma estado civil, raça/cor e quilombola; esta grava essas
 * dimensões em PerfilSocial, por município e gênero, junto com as contagens
 * de eleitores com biometria, com deficiência e com nome social.
 *
 * Roda depois do load.js e substitui o conteúdo de PerfilSocial numa única
 * transação: se a carga falhar no meio, a tabela fica como estava. No fim,
 * o total de eleitores é conferido com o de EleitoradoPerfil — se não bater,
 * as duas cargas não vieram do mesmo arquivo.
 *
 * Execução (dentro do container Docker):
 *   docker compose exec backend node etl/loadPerfilSocial.js
 */

import { createReadStream } from 'fs'
import { parse }            from 'csv-parse'
import iconv                from 'iconv-lite'
import { PrismaClient }     from '@prisma/client'

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────

const CSV_PATH   = '/data/eleitorado.csv'
const BATCH_SIZE = 1000
const LOG_STEP   = 1_000_000

// Mesmos códigos de etl/load.js, para o filtro de gênero valer igual nas duas tabelas.
const GENERO_MAP     = { '2': 'M', '4': 'F' }
const QUILOMBOLA_MAP = { '1': 'S', '2': 'N' }

// O arquivo de 2026 trocou COR_RACA por RACA_COR. O nome antigo é traduzido
// na leitura do cabeçalho e o resto do script só conhece a grafia atual.
const NOMES_ANTIGOS = { CD_COR_RACA: 'CD_RACA_COR', DS_COR_RACA: 'DS_RACA_COR' }

const COLUNAS = [
  'SG_UF', 'CD_MUNICIPIO', 'NM_MUNICIPIO', 'CD_GENERO',
  'CD_ESTADO_CIVIL', 'DS_ESTADO_CIVIL', 'CD_RACA_COR', 'DS_RACA_COR', 'CD_QUILOMBOLA',
  'QT_ELEITORES', 'QT_ELEITORES_BIOMETRIA', 'QT_ELEITORES_DEFICIENCIA', 'QT_ELEITORES_NOME_SOCIAL',
]

const MEDIDAS = ['quantidade', 'comBiometria', 'comDeficiencia', 'comNomeSocial']

const prisma = new PrismaClient()

// ─── FASE EXTRACT ─────────────────────────────────────────────────────────────

// Mesma leitura de etl/load.js: stream, ISO-8859-1 e separador ';'.
function extractStream() {
  const parser = parse({
    delimiter: ';',
    columns: lerCabecalho,
    trim: true,
    quote: '"',
    skip_empty_lines: true,
    cast: false,
  })

  return createReadStream(CSV_PATH)
    .pipe(iconv.decodeStream('iso-8859-1'))
    .pipe(parser)
}

// Arquivo em outro formato para aqui, antes de qualquer escrita no banco.
function lerCabecalho(cabecalho) {
  const colunas  = cabecalho.map(c => NOMES_ANTIGOS[c] ?? c)
  const ausentes = COLUNAS.filter(c => !colunas.includes(c))

  if (ausentes.length > 0) {
    throw new Error(`Colunas ausentes no CSV: ${ausentes.join(', ')}`)
  }
  return colunas
}

// ─── FASE TRANSFORM ───────────────────────────────────────────────────────────

function contagem(valor) {
  const n = parseInt(valor, 10)
  return Number.isInteger(n) && n >= 0 ? n : null
}

/** @returns {Object|null} Linha normalizada ou null se for inválida */
function transformRow(row) {
  const medidas = {
    quantidade:     contagem(row['QT_ELEITORES']),
    comBiometria:   contagem(row['QT_ELEITORES_BIOMETRIA']),
    comDeficiencia: contagem(row['QT_ELEITORES_DEFICIENCIA']),
    comNomeSocial:  contagem(row['QT_ELEITORES_NOME_SOCIAL']),
  }

  if (!row['SG_UF'] || !row['CD_MUNICIPIO'] || !row['CD_GENERO'] ||
      !row['CD_ESTADO_CIVIL'] || !row['CD_RACA_COR'] ||
      MEDIDAS.some(m => medidas[m] == null)) {
    return null
  }

  return {
    municipio:   { codigo: row['CD_MUNICIPIO'], nome: row['NM_MUNICIPIO'] || row['CD_MUNICIPIO'], uf: row['SG_UF'] },
    estadoCivil: { codigo: row['CD_ESTADO_CIVIL'], descricao: row['DS_ESTADO_CIVIL'] || row['CD_ESTADO_CIVIL'] },
    racaCor:     { codigo: row['CD_RACA_COR'], descricao: row['DS_RACA_COR'] || row['CD_RACA_COR'] },
    genero:      GENERO_MAP[row['CD_GENERO']] ?? 'NI',
    quilombola:  QUILOMBOLA_MAP[row['CD_QUILOMBOLA']] ?? 'NI',
    medidas,
  }
}

// ─── FASE LOAD ────────────────────────────────────────────────────────────────

/** Upsert das descrições de uma dimensão; devolve código → id. */
async function gravarDimensao(tabela, itens) {
  const ids = new Map()
  for (const { codigo, descricao } of itens.values()) {
    const r = await tabela.upsert({
      where:  { codigo },
      update: { descricao },
      create: { codigo, descricao },
      select: { id: true },
    })
    ids.set(codigo, r.id)
  }
  return ids
}

// Municípios pertencem à carga principal: aqui só se cria o que faltar.
async function idsMunicipios(municipios) {
  await prisma.municipio.createMany({ data: [...municipios.values()], skipDuplicates: true })
  const todos = await prisma.municipio.findMany({ select: { id: true, codigo: true } })
  return new Map(todos.map(m => [m.codigo, m.id]))
}

async function substituirPerfis(linhas) {
  await prisma.$transaction(async tx => {
    await tx.perfilSocial.deleteMany()
    for (let i = 0; i < linhas.length; i += BATCH_SIZE) {
      await tx.perfilSocial.createMany({ data: linhas.slice(i, i + BATCH_SIZE) })
    }
  }, { timeout: 10 * 60_000 })
}

// ─── PIPELINE PRINCIPAL ───────────────────────────────────────────────────────

async function run() {
  const startTime = Date.now()
  const segundos  = () => ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║     EleitoBR — ETL do perfil social          ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`Arquivo : ${CSV_PATH}`)
  console.log(`\nFase 1/3 — Lendo e agregando CSV...\n`)

  const metrics = { lidas: 0, puladas: 0, gravadas: 0, warnings: [] }

  const agregacao    = new Map()  // municipio|genero|estadoCivil|racaCor|quilombola → linha
  const municipios   = new Map()  // codigo → { codigo, nome, uf }
  const estadosCivis = new Map()  // codigo → { codigo, descricao }
  const racasCores   = new Map()  // codigo → { codigo, descricao }

  let totais = null

  try {

    // ── FASE 1: EXTRACT + TRANSFORM + AGGREGATE ──────────────────────────
    for await (const row of extractStream()) {
      metrics.lidas++

      const t = transformRow(row)

      if (!t) {
        metrics.puladas++
        if (metrics.warnings.length < 20) {
          metrics.warnings.push(
            `Linha ${metrics.lidas}: campo ausente/inválido — ` +
            `UF=${row['SG_UF']} CD_MUNICIPIO=${row['CD_MUNICIPIO']} QT=${row['QT_ELEITORES']}`
          )
        }
        continue
      }

      if (!municipios.has(t.municipio.codigo))     municipios.set(t.municipio.codigo, t.municipio)
      if (!estadosCivis.has(t.estadoCivil.codigo)) estadosCivis.set(t.estadoCivil.codigo, t.estadoCivil)
      if (!racasCores.has(t.racaCor.codigo))       racasCores.set(t.racaCor.codigo, t.racaCor)

      const key = `${t.municipio.codigo}|${t.genero}|${t.estadoCivil.codigo}|${t.racaCor.codigo}|${t.quilombola}`
      const existing = agregacao.get(key)
      if (existing) {
        for (const m of MEDIDAS) existing.medidas[m] += t.medidas[m]
      } else {
        agregacao.set(key, {
          municipio:   t.municipio.codigo,
          estadoCivil: t.estadoCivil.codigo,
          racaCor:     t.racaCor.codigo,
          genero:      t.genero,
          quilombola:  t.quilombola,
          medidas:     { ...t.medidas },
        })
      }

      if (metrics.lidas % LOG_STEP === 0) {
        console.log(`  [${segundos()}s] lidas=${metrics.lidas.toLocaleString()} combinações=${agregacao.size.toLocaleString()}`)
      }
    }

    if (agregacao.size === 0) {
      throw new Error('Nenhuma linha válida no CSV; PerfilSocial não foi alterado.')
    }

    console.log(
      `\n  Fase 1 concluída em ${segundos()}s — ` +
      `${metrics.lidas.toLocaleString()} linhas, ` +
      `${agregacao.size.toLocaleString()} combinações únicas`
    )

    // ── FASE 2: DIMENSÕES ────────────────────────────────────────────────
    console.log('\nFase 2/3 — Persistindo dimensões...')

    const municipioIds   = await idsMunicipios(municipios)
    const estadoCivilIds = await gravarDimensao(prisma.estadoCivil, estadosCivis)
    const racaCorIds     = await gravarDimensao(prisma.racaCor, racasCores)

    console.log(`  Municípios:     ${municipios.size}`)
    console.log(`  Estados civis:  ${estadoCivilIds.size}`)
    console.log(`  Raças/cores:    ${racaCorIds.size}`)

    // ── FASE 3: PERFIS ───────────────────────────────────────────────────
    console.log('\nFase 3/3 — Substituindo perfis sociais...')

    const linhas = [...agregacao.values()].map(a => ({
      municipioId:   municipioIds.get(a.municipio),
      estadoCivilId: estadoCivilIds.get(a.estadoCivil),
      racaCorId:     racaCorIds.get(a.racaCor),
      genero:        a.genero,
      quilombola:    a.quilombola,
      ...a.medidas,
    }))

    await substituirPerfis(linhas)
    metrics.gravadas = linhas.length

    const [social, perfil] = await Promise.all([
      prisma.perfilSocial.aggregate({ _sum: { quantidade: true } }),
      prisma.eleitoradoPerfil.aggregate({ _sum: { quantidade: true } }),
    ])
    totais = { social: social._sum.quantidade ?? 0, perfil: perfil._sum.quantidade ?? 0 }

  } catch (err) {
    console.error('\n[ERRO FATAL]', err.message)
    console.error(err.stack)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║           RESUMO DA EXECUÇÃO                 ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`Tempo total              : ${segundos()}s`)
  console.log(`Linhas lidas             : ${metrics.lidas.toLocaleString()}`)
  console.log(`Combinações gravadas     : ${metrics.gravadas.toLocaleString()}`)
  console.log(`Linhas inválidas puladas : ${metrics.puladas.toLocaleString()}`)

  if (totais) {
    console.log(`Total PerfilSocial       : ${totais.social.toLocaleString()}`)
    console.log(`Total EleitoradoPerfil   : ${totais.perfil.toLocaleString()}`)
    if (totais.social !== totais.perfil) {
      console.warn('\n⚠ Os totais não batem: o CSV não parece ser o mesmo da última execução do load.js.')
    }
  }

  if (metrics.warnings.length > 0) {
    console.log(`\n[WARNINGS] — ${metrics.warnings.length} linha(s) descartada(s):`)
    for (const w of metrics.warnings) console.warn('  ⚠', w)
  }
}

run()
