import './App.css'
import { useApi }            from './hooks/useApi'
import { KPICard }           from './components/KPICard'
import { FaixaEtariaChart }  from './components/charts/FaixaEtariaChart'
import { GeneroChart }       from './components/charts/GeneroChart'
import { EscolaridadeChart } from './components/charts/EscolaridadeChart'
import { RegiaoChart }       from './components/charts/RegiaoChart'

/**
 * Componente raiz — Dashboard EleitoSP.
 *
 * Busca os dados de todos os endpoints da API e distribui aos componentes
 * filhos via props. Centralizar os useApi no topo da árvore evita que
 * componentes irmãos façam requisições duplicadas ao mesmo endpoint.
 *
 * Referência: REACT. Lifting State Up. React Docs, 2024.
 */
function App() {
  const { data: resumo }        = useApi('/api/resumo')
  const { data: faixas,
          loading: loadFaixas } = useApi('/api/faixa-etaria')
  const { data: genero,
          loading: loadGenero } = useApi('/api/genero')
  const { data: escolaridade,
          loading: loadEsc }    = useApi('/api/escolaridade')
  const { data: regioes,
          loading: loadReg }    = useApi('/api/regioes')

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Cabeçalho */}
      <header className="bg-blue-900 text-white px-8 py-6 shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">EleitoBR</h1>
        <p className="text-blue-300 text-sm mt-1">
          Perfil Demográfico do Eleitorado · Dados Abertos TSE
        </p>
      </header>

      <main className="px-8 py-8 space-y-8 max-w-screen-xl mx-auto">

        {/* KPI Cards */}
        <section>
          <p className="section-title">Visão Geral</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Total Brasil"
              value={resumo?.total_brasil}
              label="eleitores"
            />
            <KPICard
              title="Total SP"
              value={resumo?.total_sp}
              label="eleitores"
            />
            <KPICard
              title="Municípios"
              value={resumo?.total_municipios}
              label="no Brasil"
            />
            <KPICard
              title="Estados"
              value={resumo?.total_estados}
              label="+ DF"
            />
          </div>
        </section>

        {/* Gráficos — linha 1 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="chart-title">
              Distribuição por Faixa Etária
            </p>
            <FaixaEtariaChart data={faixas ?? []} loading={loadFaixas} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="chart-title">
              Distribuição por Gênero
            </p>
            <GeneroChart data={genero ?? []} loading={loadGenero} />
          </div>
        </section>

        {/* Gráficos — linha 2 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="chart-title">
              Distribuição por Escolaridade
            </p>
            <EscolaridadeChart data={escolaridade ?? []} loading={loadEsc} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="chart-title">
              SP vs Brasil — Eleitores por Estado
            </p>
            <RegiaoChart data={regioes ?? []} loading={loadReg} />
          </div>
        </section>

      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Fonte: TSE — Dados Abertos do Eleitorado
      </footer>
    </div>
  )
}

export default App
