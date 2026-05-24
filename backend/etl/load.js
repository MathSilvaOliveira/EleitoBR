/**
 * ETL — EleitoSP
 *
 * Carrega os dados públicos do TSE (Tribunal Superior Eleitoral) sobre o
 * perfil demográfico do eleitorado de todos os estados brasileiros no banco
 * PostgreSQL.
 *
 * O CSV do TSE tem 11 dimensões por linha (incluindo cor/raça, estado civil,
 * identidade de gênero, etc.). O schema armazena 5: municipio, zona, faixa
 * etária, escolaridade e gênero. As 6 dimensões não armazenadas são somadas
 * durante a fase de agregação, garantindo que as quantidades no banco
 * representem o total real de eleitores — não apenas um sub-grupo.
 *
 * Referências bibliográficas:
 *   KIMBALL, R.; ROSS, M. The Data Warehouse Toolkit. 3. ed. Wiley, 2013.
 *   KLEPPMANN, M. Designing Data-Intensive Applications. O'Reilly, 2017.
 *   MILEWSKI, A. E. Database Systems. Springer, 2019.
 *   RAHM, E.; DO, H. H. Data Cleaning: Problems and Current Approaches.
 *     IEEE Data Engineering Bulletin, v. 23, n. 4, p. 3–13, 2000.
 *
 * Execução (dentro do container Docker):
 *   docker compose exec backend node etl/load.js
 */

import { createReadStream } from 'fs'
import { parse }            from 'csv-parse'
import iconv                from 'iconv-lite'
import { PrismaClient }     from '@prisma/client'

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────

const CSV_PATH   = '/data/eleitorado.csv'
const BATCH_SIZE = 1000
const LOG_STEP   = 500_000

/**
 * Mapeamento de códigos de gênero do TSE para valores semânticos.
 *
 * Normalização semântica: os códigos numéricos do TSE são convertidos para
 * valores legíveis, facilitando as consultas da API e a leitura do banco.
 */
const GENERO_MAP = {
  '2': 'M',  // MASCULINO
  '4': 'F',  // FEMININO
}

const prisma = new PrismaClient()

// ─── FASE EXTRACT ─────────────────────────────────────────────────────────────

/**
 * Cria o pipeline de leitura do arquivo CSV do TSE.
 *
 * Stream processing: evita carregar o arquivo inteiro na memória (~2,3 GB).
 * Padrão recomendado para arquivos grandes conforme a documentação oficial
 * do Node.js Streams.
 *
 * Separação das fases Extract, Transform e Load — padrão consolidado na
 * literatura de data warehousing (KIMBALL; ROSS, 2013).
 */
function extractStream() {
  const fileStream = createReadStream(CSV_PATH)

  /**
   * Encoding explícito: o TSE publica os arquivos em ISO-8859-1 (Latin-1).
   * A conversão explícita via iconv-lite evita corrupção de caracteres
   * acentuados que ocorreria se o Node.js interpretasse os bytes como UTF-8.
   */
  const decoder = iconv.decodeStream('iso-8859-1')

  const parser = parse({
    delimiter: ';',
    columns: true,
    trim: true,
    quote: '"',
    skip_empty_lines: true,
    cast: false,
  })

  return fileStream.pipe(decoder).pipe(parser)
}

// ─── FASE TRANSFORM ───────────────────────────────────────────────────────────

/**
 * Valida e normaliza uma linha do CSV.
 *
 * Data cleansing: etapa de limpeza de dados — essencial para garantir
 * qualidade dos dados carregados (RAHM; DO, 2000).
 *
 * @returns {Object|null} Objeto normalizado ou null se a linha for inválida
 */
function transformRow(row) {
  const uf                 = row['SG_UF']?.trim()
  const municipioCodigo    = row['CD_MUNICIPIO']?.trim()
  const municipioNome      = row['NM_MUNICIPIO']?.trim()
  const zona               = row['NR_ZONA']?.trim()
  const faixaCodigo        = row['CD_FAIXA_ETARIA']?.trim()
  const faixaDescricao     = row['DS_FAIXA_ETARIA']?.trim()
  const escolaridadeCodigo = row['CD_GRAU_INSTRUCAO']?.trim()
  const escolaridadeDesc   = row['DS_GRAU_INSTRUCAO']?.trim()
  const generoCodigo       = row['CD_GENERO']?.trim()
  const qtRaw              = row['QT_ELEITORES']?.trim()

  if (!uf || !municipioCodigo || !zona || !faixaCodigo ||
      !escolaridadeCodigo || !generoCodigo || !qtRaw) {
    return null
  }

  const quantidade = parseInt(qtRaw, 10)
  if (isNaN(quantidade) || quantidade < 0) return null

  /**
   * Normalização semântica do campo gênero: os códigos numéricos do TSE
   * são convertidos para 'M', 'F' ou 'NI' (não informado).
   */
  const genero = GENERO_MAP[generoCodigo] ?? 'NI'

  return {
    municipio:    { codigo: municipioCodigo, nome: municipioNome ?? municipioCodigo, uf },
    faixaEtaria:  { codigo: faixaCodigo,     descricao: faixaDescricao ?? faixaCodigo },
    escolaridade: { codigo: escolaridadeCodigo, descricao: escolaridadeDesc ?? escolaridadeCodigo },
    zona,
    genero,
    quantidade,
  }
}

// ─── FASE LOAD ────────────────────────────────────────────────────────────────

/**
 * Persiste um batch de perfis eleitorais no banco de dados.
 *
 * Insert em batch: reduz o número de round-trips ao banco de dados.
 * Inserções em lote são significativamente mais eficientes que inserções
 * individuais (MILEWSKI, 2019).
 *
 * skipDuplicates: permite reexecução segura do ETL sem falhar em registros
 * já existentes. Funciona com o @@unique definido no schema Prisma para
 * (municipioId, faixaEtariaId, escolaridadeId, genero, zona).
 */
async function loadBatch(batch) {
  if (batch.length === 0) return 0
  const result = await prisma.eleitoradoPerfil.createMany({
    data: batch,
    skipDuplicates: true,
  })
  return result.count
}

// ─── PIPELINE PRINCIPAL ───────────────────────────────────────────────────────

async function run() {
  const startTime = Date.now()

  console.log('╔══════════════════════════════════════════════╗')
  console.log('║          EleitoSP — ETL iniciado             ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`Arquivo : ${CSV_PATH}`)
  console.log(`Escopo  : todos os estados`)
  console.log(`Batch   : ${BATCH_SIZE} registros por inserção`)
  console.log(`\nFase 1/3 — Lendo e agregando CSV...\n`)

  const metrics = {
    lidas:    0,
    inseridas: 0,
    puladas:  0,
    warnings: [],
  }

  let municipioCache    = new Map()
  let faixaEtariaCache  = new Map()
  let escolaridadeCache = new Map()

  /**
   * Mapa de agregação em memória — chave = dimensões armazenadas no schema.
   *
   * O CSV do TSE tem uma linha por combinação de TODAS as 11 dimensões
   * (incluindo cor/raça, estado civil, etc.). O schema armazena apenas 5:
   * municipio, zona, faixa_etaria, escolaridade e genero.
   *
   * A chave de agregação inclui a zona eleitoral, preservando a
   * granularidade por zona para comparações entre municípios e estados,
   * mas somando as 6 dimensões não armazenadas (cor/raça, estado civil,
   * identidade de gênero, quilombola, intérprete de libras e
   * obrigatoriedade de voto).
   *
   * Separação das fases Extract, Transform e Load — padrão consolidado na
   * literatura de data warehousing (KIMBALL; ROSS, 2013). A agregação em
   * memória é parte da fase Transform: garante que as quantidades no banco
   * representem o total real de eleitores por combinação das 5 dimensões.
   *
   * Espaço em memória: ~1,67M combinações únicas × ~150 bytes ≈ 250 MB.
   */
  const agregacao     = new Map()  // chave composta → { dados, quantidade }
  const municipios    = new Map()  // codigo → { codigo, nome, uf }
  const faixasEtarias = new Map()  // codigo → { codigo, descricao }
  const escolaridades = new Map()  // codigo → { codigo, descricao }

  try {

    // ── FASE 1: EXTRACT + TRANSFORM + AGGREGATE ──────────────────────────
    const parser = extractStream()

    for await (const row of parser) {
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

      // Coleta dimensões únicas para upsert na Fase 2
      if (!municipios.has(t.municipio.codigo))
        municipios.set(t.municipio.codigo, t.municipio)
      if (!faixasEtarias.has(t.faixaEtaria.codigo))
        faixasEtarias.set(t.faixaEtaria.codigo, t.faixaEtaria)
      if (!escolaridades.has(t.escolaridade.codigo))
        escolaridades.set(t.escolaridade.codigo, t.escolaridade)

      /**
       * Chave de agregação: inclui zona para preservar granularidade
       * por zona eleitoral, mas exclui as 6 dimensões não armazenadas
       * (cor/raça, estado civil, etc.) — cujas quantidades são somadas.
       */
      const key = `${t.municipio.codigo}|${t.zona}|${t.faixaEtaria.codigo}|${t.escolaridade.codigo}|${t.genero}`
      const existing = agregacao.get(key)
      if (existing) {
        existing.quantidade += t.quantidade
      } else {
        agregacao.set(key, {
          municipio:   t.municipio,
          faixaEtaria: t.faixaEtaria,
          escolaridade: t.escolaridade,
          zona:        t.zona,
          genero:      t.genero,
          quantidade:  t.quantidade,
        })
      }

      /**
       * Logging de progresso e métricas: observabilidade do pipeline —
       * permite monitorar a execução em tempo real.
       */
      if (metrics.lidas % LOG_STEP === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
        const pct     = ((metrics.lidas / 10_840_166) * 100).toFixed(1)
        process.stdout.write(
          `  [${elapsed}s | ${pct}%] lidas=${metrics.lidas.toLocaleString()} ` +
          `combinações=${agregacao.size.toLocaleString()}\n`
        )
      }
    }

    const t1 = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(
      `\n  Fase 1 concluída em ${t1}s — ` +
      `${metrics.lidas.toLocaleString()} linhas, ` +
      `${agregacao.size.toLocaleString()} combinações únicas`
    )

    // ── FASE 2: UPSERT DAS DIMENSÕES ─────────────────────────────────────
    //
    // Upsert nas dimensões (idempotência): o script pode ser executado
    // múltiplas vezes sem criar registros duplicados. Princípio descrito em
    // KLEPPMANN (2017) como característica essencial de pipelines confiáveis.
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nFase 2/3 — Persistindo dimensões...')

    for (const { codigo, nome, uf } of municipios.values()) {
      const r = await prisma.municipio.upsert({
        where:  { codigo },
        update: { nome, uf },
        create: { codigo, nome, uf },
        select: { id: true },
      })
      municipioCache.set(codigo, r.id)
    }
    console.log(`  Municípios:     ${municipioCache.size}`)

    for (const { codigo, descricao } of faixasEtarias.values()) {
      const r = await prisma.faixaEtaria.upsert({
        where:  { codigo },
        update: { descricao },
        create: { codigo, descricao },
        select: { id: true },
      })
      faixaEtariaCache.set(codigo, r.id)
    }
    console.log(`  Faixas etárias: ${faixaEtariaCache.size}`)

    for (const { codigo, descricao } of escolaridades.values()) {
      const r = await prisma.escolaridade.upsert({
        where:  { codigo },
        update: { descricao },
        create: { codigo, descricao },
        select: { id: true },
      })
      escolaridadeCache.set(codigo, r.id)
    }
    console.log(`  Escolaridades:  ${escolaridadeCache.size}`)

    // ── FASE 3: INSERT EM BATCH DOS PERFIS ───────────────────────────────
    console.log('\nFase 3/3 — Inserindo perfis em batch...')

    let batch = []

    for (const entry of agregacao.values()) {
      batch.push({
        municipioId:    municipioCache.get(entry.municipio.codigo),
        faixaEtariaId:  faixaEtariaCache.get(entry.faixaEtaria.codigo),
        escolaridadeId: escolaridadeCache.get(entry.escolaridade.codigo),
        genero:         entry.genero,
        zona:           entry.zona,
        quantidade:     entry.quantidade,
      })

      if (batch.length >= BATCH_SIZE) {
        metrics.inseridas += await loadBatch(batch)
        batch = []
      }
    }

    if (batch.length > 0) {
      metrics.inseridas += await loadBatch(batch)
    }

  } catch (err) {
    console.error('\n[ERRO FATAL]', err.message)
    console.error(err.stack)
    process.exitCode = 1
  } finally {
    /**
     * Tratamento de erros com finally: garante que a conexão com o banco
     * seja encerrada mesmo em caso de erro, evitando connection leaks.
     */
    await prisma.$disconnect()
  }

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║           RESUMO DA EXECUÇÃO                 ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`Tempo total              : ${totalSec}s`)
  console.log(`Linhas lidas             : ${metrics.lidas.toLocaleString()}`)
  console.log(`Combinações únicas       : ${metrics.inseridas.toLocaleString()}`)
  console.log(`Linhas inválidas puladas : ${metrics.puladas.toLocaleString()}`)
  console.log(`Municípios               : ${municipioCache.size}`)
  console.log(`Faixas etárias           : ${faixaEtariaCache.size}`)
  console.log(`Escolaridades            : ${escolaridadeCache.size}`)

  if (metrics.warnings.length > 0) {
    console.log(`\n[WARNINGS] — ${metrics.warnings.length} linha(s) descartada(s):`)
    for (const w of metrics.warnings) console.warn('  ⚠', w)
  }
}

run()