import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('theragift_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('theragift_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('theragift_user', JSON.stringify(res.data))
      })
      .catch(() => {
        localStorage.removeItem('theragift_token')
        localStorage.removeItem('theragift_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('theragift_token', res.data.token)
    const userData = {
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      role: res.data.role,
    }
    localStorage.setItem('theragift_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload)
    localStorage.setItem('theragift_token', res.data.token)
    const userData = {
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      role: res.data.role,
    }
    localStorage.setItem('theragift_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('theragift_token')
    localStorage.removeItem('theragift_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
