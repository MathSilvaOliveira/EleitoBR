import { createContext, useContext } from 'react'

export const TemaContext = createContext(null)

export function useTema() {
  const ctx = useContext(TemaContext)
  if (!ctx) throw new Error('useTema deve ser usado dentro de <TemaProvider>')
  return ctx
}