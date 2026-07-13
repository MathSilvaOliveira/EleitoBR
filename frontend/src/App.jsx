import './App.css'
import { useApi }     from './hooks/useApi'
import { useFiltros } from './context/FiltrosContext'
import { KPICard }    from './components/KPICard'
import { FilterBar }  from './components/FilterBar'
import { ChartCard, ThemeToggle } from './components/ui/Primitivas'
import { PiramideEtariaChart }      from './components/charts/PiramideEtariaChart'
import { HeatmapEscolaridadeFaixa } from './components/charts/HeatmapEscolaridadeFaixa'
import { EscolaridadeGeneroChart }  from './components/charts/EscolaridadeGeneroChart'
import { GeneroChart }              from './components/charts/GeneroChart'
import { RegiaoChart }              from './components/charts/RegiaoChart'
import { RankingMunicipios }        from './components/RankingMunicipios'
import { ExteriorPanel }            from './components/ExteriorPanel'

function App() {
  const { apiParams, rotulo, uf } = useFiltros()

  const resumo       = useApi('/api/resumo', apiParams)
  const genero       = useApi('/api/genero', apiParams)
  const regioes      = useApi('/api/regioes')
  const piramide     = useApi('/api/cruzamentos/genero-faixa', apiParams)
  const heatmap      = useApi('/api/cruzamentos/escolaridade-faixa', apiParams)
  const escGenero    = useApi('/api/cruzamentos/escolaridade-genero', apiParams)

  const temSelecao = resumo.data?.total_selecao != null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

      {/* Cabeçalho */}
      <header className="bg-blue-900 dark:bg-gray-950 text-white px-8 py-6 shadow-md
                         flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">EleitoBR</h1>
          <p className="text-blue-300 text-sm mt-1">
            Perfil Demográfico do Eleitorado · Dados Abertos TSE
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className="px-4 sm:px-8 py-8 space-y-8 max-w-screen-xl mx-auto">

        {/* Filtros dinâmicos */}
        <FilterBar ufs={regioes.data ?? []} />

        {/* KPI Cards */}
        <section>
          <p className="section-title">Visão Geral</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Brasil"
              value={resumo.data?.total_brasil}
              label="eleitores (sem exterior)"
            />
            <KPICard
              title="Exterior"
              value={resumo.data?.total_exterior}
              label="eleitores fora do país"
            />
            <KPICard
              title={temSelecao ? `Seleção: ${rotulo}` : 'Municípios'}
              value={temSelecao
                ? resumo.data?.total_selecao
                : resumo.data?.total_municipios}
              label={temSelecao ? 'eleitores na seleção' : 'no Brasil'}
              destaque={temSelecao}
            />
            <KPICard
              title="Estados"
              value={resumo.data?.total_estados}
              label="+ DF"
            />
          </div>
        </section>

        {/* Cruzamentos — linha 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            titulo="Pirâmide Etária do Eleitorado"
            subtitulo={`Gênero × faixa etária · ${rotulo}`}
            info="Cruzamento entre gênero e faixa etária. Barras à esquerda: eleitores do gênero masculino; à direita: feminino. A assimetria entre os lados revela a predominância feminina no eleitorado, acentuada nas faixas mais idosas pela maior longevidade das mulheres."
            loading={piramide.loading}
            error={piramide.error}
            altura={480}
          >
            <PiramideEtariaChart data={piramide.data ?? []} />
          </ChartCard>

          <ChartCard
            titulo="Distribuição por Gênero"
            subtitulo={rotulo}
            info="Composição do eleitorado por gênero na seleção atual. 'Não informado' corresponde a registros sem declaração de gênero na base do TSE."
            loading={genero.loading}
            error={genero.error}
            altura={480}
          >
            <GeneroChart data={genero.data ?? []} />
          </ChartCard>
        </section>

        {/* Cruzamentos — linha 2 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            titulo="Mapa de Calor: Escolaridade × Idade"
            subtitulo={`Participação de cada combinação no total · ${rotulo}`}
            info="Cada célula mostra a participação percentual da combinação escolaridade × macro-faixa etária no total de eleitores da seleção. Células mais escuras concentram mais eleitores. Passe o mouse para os valores exatos. Permite identificar, por exemplo, a concentração de baixa instrução nas faixas mais idosas."
            loading={heatmap.loading}
            error={heatmap.error}
            altura={420}
          >
            <HeatmapEscolaridadeFaixa data={heatmap.data} />
          </ChartCard>

          <ChartCard
            titulo="Escolaridade × Gênero"
            subtitulo={`Composição por gênero em cada grau de instrução · ${rotulo}`}
            info="Barras empilhadas: cada barra é um grau de instrução e os segmentos mostram a divisão por gênero, revelando em quais níveis educacionais cada gênero predomina."
            loading={escGenero.loading}
            error={escGenero.error}
          >
            <EscolaridadeGeneroChart data={escGenero.data ?? []} />
          </ChartCard>
        </section>

        {/* Comparação entre estados + drill-down */}
        <section>
          <ChartCard
            titulo="Eleitores por Estado"
            subtitulo="Clique em uma barra para filtrar todo o dashboard pela UF"
            info="Total de eleitores por unidade federativa (exclui o exterior). Funciona como controle de drill-down: clicar em um estado aplica o filtro globalmente; clicar novamente remove."
            loading={regioes.loading}
            error={regioes.error}
          >
            <RegiaoChart data={regioes.data ?? []} />
          </ChartCard>
        </section>

        {/* Indicadores originais */}
        {uf !== 'ZZ' && (
          <section>
            <RankingMunicipios />
          </section>
        )}

        {/* Exterior */}
        <section>
          <ExteriorPanel />
        </section>

      </main>

      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">
        Fonte: TSE — Dados Abertos do Eleitorado ·
        Indicadores IEE e Hiato Instrucional: elaboração própria
      </footer>
    </div>
  )
}

export default App
