import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: 'demo@theragift.app', password: 'password123', fullName: '', specialty: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          specialty: form.specialty,
        })
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu, lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-panel border border-border rounded-3xl p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold text-brand-dark">TheraGift</div>
          <div className="text-xs text-muted mt-1">Psikologlar için dijital asistan</div>
        </div>

        <div className="flex bg-white rounded-xl border border-border p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'login' ? 'bg-brand text-white' : 'text-muted'}`}
            onClick={() => setMode('login')}
          >
            Giriş yap
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold ${mode === 'register' ? 'bg-brand text-white' : 'text-muted'}`}
            onClick={() => setMode('register')}
          >
            Demo oluştur
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Ad Soyad</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Uzm. Psk. ..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">E-posta</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="psikolog@example.com"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Uzmanlık alanı</label>
              <input
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Yetişkin terapisi"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Şifre</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-light transition-colors text-white font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Bekleyin...' : mode === 'login' ? 'Giriş yap' : 'Demo oluştur'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-muted">
          Demo hesap: <strong>demo@theragift.app</strong> / <strong>password123</strong>
        </div>
      </div>
    </div>
  )
}
