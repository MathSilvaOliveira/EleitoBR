import { createContext, useContext } from 'react'

export const FiltrosContext = createContext(null)

export function useFiltros() {
  const ctx = useContext(FiltrosContext)
  if (!ctx) throw new Error('useFiltros deve ser usado dentro de <FiltrosProvider>')
  return ctx
}