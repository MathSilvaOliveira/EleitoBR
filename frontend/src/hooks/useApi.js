import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function toQueryString(params) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') qs.set(k, String(v))
  }
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export function useApi(endpoint, params = {}) {
  const queryString = toQueryString(params)
  const url         = `${BASE_URL}${endpoint}${queryString}`

  const [state, setState] = useState({
    url:     null,
    data:    null,
    loading: true,
    error:   null,
  })

  const urlAtualRef = useRef(null)

  useEffect(() => {
    urlAtualRef.current  = url
    const controller     = new AbortController()

    axios
      .get(url, { signal: controller.signal })
      .then(res => {
        if (urlAtualRef.current !== url) return
        setState({ url, data: res.data, loading: false, error: null })
      })
      .catch(err => {
        if (axios.isCancel(err) || err.name === 'CanceledError') return
        if (urlAtualRef.current !== url) return
        setState({
          url,
          data:    null,
          loading: false,
          error:   err.response?.data?.message ?? err.message,
        })
      })

    return () => controller.abort()
  }, [url])

  const loading = state.url !== url || state.loading

  return { data: state.data, loading, error: state.error }
}