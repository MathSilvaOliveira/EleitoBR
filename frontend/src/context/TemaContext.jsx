import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const TemaContext = createContext(null)

const PALETAS = {
  light: {
    eixo:       '#6b7280',
    grade:      '#e5e7eb',
    tooltipBg:  '#ffffff',
    tooltipTxt: '#111827',
    borda:      '#e5e7eb',
    // Séries — azul/rosa mantêm a convenção já usada no projeto
    masculino:  '#3b82f6',
    feminino:   '#ec4899',
    naoInf:     '#94a3b8',
    primaria:   '#2563eb',
    destaque:   '#1d4ed8',
    suave:      '#93c5fd',
    acento:     '#8b5cf6',
  },
  dark: {
    eixo:       '#9ca3af',
    grade:      '#374151',
    tooltipBg:  '#1f2937',
    tooltipTxt: '#f9fafb',
    borda:      '#374151',
    masculino:  '#60a5fa',
    feminino:   '#f472b6',
    naoInf:     '#6b7280',
    primaria:   '#3b82f6',
    destaque:   '#60a5fa',
    suave:      '#1e40af',
    acento:     '#a78bfa',
  },
}

function temaInicial() {
  const salvo = localStorage.getItem('eleitosp-tema')
  if (salvo === 'dark' || salvo === 'light') return salvo
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function TemaProvider({ children }) {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'dark')
    localStorage.setItem('eleitosp-tema', tema)
  }, [tema])

  const value = useMemo(() => ({
    tema,
    alternar: () => setTema(t => (t === 'dark' ? 'light' : 'dark')),
    paleta:   PALETAS[tema],
  }), [tema])

  return <TemaContext.Provider value={value}>{children}</TemaContext.Provider>
}

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema deve ser usado dentro de <TemaProvider>')
  return ctx
}
