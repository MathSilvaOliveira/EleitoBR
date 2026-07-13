import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function useApi(endpoint, params = {}) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined && v !== '') qs.set(k, v)
    }
    const s = qs.toString()
    return s ? `?${s}` : ''
  }, [JSON.stringify(params)])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    axios
      .get(`${BASE_URL}${endpoint}${queryString}`, { signal: controller.signal })
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        if (axios.isCancel(err) || err.name === 'CanceledError') return
        setError(err.response?.data?.message ?? err.message)
        setLoading(false)
      })

    return () => controller.abort()
  }, [endpoint, queryString])

  return { data, loading, error }
}
