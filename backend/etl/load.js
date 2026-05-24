/**
 * ETL — EleitoSP
 *
 * Carrega os dados públicos do TSE (Tribunal Superior Eleitoral) sobre o
 * perfil demográfico do eleitorado de todos os estados brasileiros no banco
 * PostgreSQL. Mantém a granularidade original por zona eleitoral, permitindo
 * comparações entre estados e entre municípios.
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
const BATCH_SIZE = 1000    // registros por round-trip ao banco
const LOG_STEP   = 50_000  // frequência de log (arquivo tem 10,8 M de linhas)

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
 * literatura de data warehousing (KIMBALL; ROSS, 2013). Esta função
 * representa exclusivamente a fase Extract.
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
    columns: true,           // usa a primeira linha como nomes de colunas
    trim: true,
    quote: '"',
    skip_empty_lines: true,
    cast: false,             // mantém tudo como string; conversão no Transform
  })

  return fileStream.pipe(decoder).pipe(parser)
}

// ─── FASE TRANSFORM ───────────────────────────────────────────────────────────

/**
 * Valida e normaliza uma linha do CSV.
 *
 * Data cleansing: etapa de limpeza de dados — essencial para garantir
 * qualidade dos dados carregados (RAHM; DO, 2000). Linhas com campos
 * obrigatórios ausentes ou inválidos são descartadas com log de aviso.
 *
 * @param {Object} row - Objeto com as colunas do CSV como propriedades
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

  // Validação de campos obrigatórios
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
    uf,
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
  console.log(`Escopo  : todos os estados (sem filtro de UF)`)
  console.log(`Batch   : ${BATCH_SIZE} registros por inserção`)
  console.log(`Log     : a cada ${LOG_STEP.toLocaleString()} linhas lidas\n`)

  const metrics = {
    lidas:    0,
    inseridas: 0,
    puladas:  0,
    warnings: [],
  }

  /**
   * Caches em memória para as tabelas de dimensão.
   *
   * Upsert nas dimensões (idempotência): o script pode ser executado
   * múltiplas vezes sem criar registros duplicados. Princípio descrito em
   * KLEPPMANN (2017) como característica essencial de pipelines confiáveis.
   *
   * Os caches reduzem chamadas ao banco de O(n) para O(d), onde d é o
   * número de dimensões únicas: ~5.570 municípios, 24 faixas, 9 escolaridades.
   */
  const municipioCache    = new Map()  // codigo → id
  const faixaEtariaCache  = new Map()  // codigo → id
  const escolaridadeCache = new Map()  // codigo → id

  try {
    console.log('Iniciando leitura e carga...\n')

    const parser = extractStream()
    let batch = []

    for await (const row of parser) {
      metrics.lidas++

      const transformed = transformRow(row)

      if (!transformed) {
        metrics.puladas++
        if (metrics.warnings.length < 20) {
          metrics.warnings.push(
            `Linha ${metrics.lidas}: campo ausente/inválido — ` +
            `UF=${row['SG_UF']} CD_MUNICIPIO=${row['CD_MUNICIPIO']} QT_ELEITORES=${row['QT_ELEITORES']}`
          )
        }
        continue
      }

      const { municipio, faixaEtaria, escolaridade, zona, genero, quantidade } = transformed

      // ── Upsert de dimensões com cache ───────────────────────────────────
      //
      // Upsert nas dimensões (idempotência): o upsert garante que múltiplas
      // execuções do ETL não gerem duplicatas. O cache em memória evita
      // chamadas repetidas ao banco para os mesmos códigos — a grande maioria
      // das linhas do CSV reutiliza as mesmas dimensões já cacheadas.

      if (!municipioCache.has(municipio.codigo)) {
        const r = await prisma.municipio.upsert({
          where:  { codigo: municipio.codigo },
          update: { nome: municipio.nome, uf: municipio.uf },
          create: { codigo: municipio.codigo, nome: municipio.nome, uf: municipio.uf },
          select: { id: true },
        })
        municipioCache.set(municipio.codigo, r.id)
      }

      if (!faixaEtariaCache.has(faixaEtaria.codigo)) {
        const r = await prisma.faixaEtaria.upsert({
          where:  { codigo: faixaEtaria.codigo },
          update: { descricao: faixaEtaria.descricao },
          create: { codigo: faixaEtaria.codigo, descricao: faixaEtaria.descricao },
          select: { id: true },
        })
        faixaEtariaCache.set(faixaEtaria.codigo, r.id)
      }

      if (!escolaridadeCache.has(escolaridade.codigo)) {
        const r = await prisma.escolaridade.upsert({
          where:  { codigo: escolaridade.codigo },
          update: { descricao: escolaridade.descricao },
          create: { codigo: escolaridade.codigo, descricao: escolaridade.descricao },
          select: { id: true },
        })
        escolaridadeCache.set(escolaridade.codigo, r.id)
      }

      batch.push({
        municipioId:    municipioCache.get(municipio.codigo),
        faixaEtariaId:  faixaEtariaCache.get(faixaEtaria.codigo),
        escolaridadeId: escolaridadeCache.get(escolaridade.codigo),
        genero,
        zona,
        quantidade,
      })

      // Flush do batch quando atinge o limite
      if (batch.length >= BATCH_SIZE) {
        metrics.inseridas += await loadBatch(batch)
        batch = []
      }

      /**
       * Logging de progresso e métricas: observabilidade do pipeline —
       * permite monitorar a execução em tempo real e estimar o tempo restante.
       */
      if (metrics.lidas % LOG_STEP === 0) {
        const elapsed  = ((Date.now() - startTime) / 1000).toFixed(1)
        const rate     = Math.round(metrics.lidas / parseFloat(elapsed))
        const pct      = ((metrics.lidas / 10_840_166) * 100).toFixed(1)
        process.stdout.write(
          `  [${elapsed}s | ${pct}%] lidas=${metrics.lidas.toLocaleString()} ` +
          `inseridas=${metrics.inseridas.toLocaleString()} ` +
          `(${rate.toLocaleString()} linhas/s)\n`
        )
      }
    }

    // Flush do batch residual
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
     * seja encerrada mesmo em caso de erro, evitando connection leaks —
     * situação em que conexões abertas esgotam o pool do PostgreSQL.
     */
    await prisma.$disconnect()
  }

  const totalSec = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║           RESUMO DA EXECUÇÃO                 ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`Tempo total              : ${totalSec}s`)
  console.log(`Linhas lidas             : ${metrics.lidas.toLocaleString()}`)
  console.log(`Registros inseridos      : ${metrics.inseridas.toLocaleString()}`)
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
