import './App.css'
import { useRota }     from './hooks/useRota'
import { Cabecalho }   from './components/Cabecalho'
import { Procedencia } from './components/Procedencia'
import { PainelGeral } from './pages/PainelGeral'
import { Comparar }    from './pages/Comparar'

function App() {
  const [rota, navegar] = useRota()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">

      <Cabecalho rota={rota} navegar={navegar} />

      <main className="px-4 sm:px-8 py-8 space-y-8 max-w-screen-xl mx-auto">
        {rota === '/comparar' ? <Comparar /> : <PainelGeral />}
      </main>

      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">
        Fonte: TSE — Dados Abertos do Eleitorado ·
        Indicadores IEE e Hiato Instrucional: elaboração própria
        <Procedencia />
      </footer>
    </div>
  )
}

export default App
