/**
 * Hook customizado para busca de dados da API EleitoSP.
 *
 * Separa a lógica de busca de dados do componente visual — padrão descrito
 * em ABRAMOV (2015) como "Presentational and Container Components": componentes
 * visuais recebem dados como props e não conhecem a origem; a lógica de
 * fetch fica isolada e reutilizável em qualquer componente.
 *
 * Referência: ABRAMOV, D. Presentational and Container Components.
 *   Medium, 2015.
 */

import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = 'http://localhost:3001'

/**
 * @param {string} endpoint - Caminho do endpoint (ex: '/api/resumo')
 * @returns {{ data: any, loading: boolean, error: string|null }}
 */
export function useApi(endpoint) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    axios
      .get(`${BASE_URL}${endpoint}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [endpoint])

  return { data, loading, error }
}
