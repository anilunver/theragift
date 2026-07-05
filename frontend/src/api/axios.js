import axios from 'axios'

// V2.4.1: API base URL artık Vite ortam değişkeninden okunuyor. Hiçbir
// VITE_API_BASE_URL verilmezse (local geliştirme varsayılanı) davranış
// AYNEN korunur — önceki hardcoded değerle birebir aynı fallback kullanılır.
// Production build'de .env.production veya deploy ortamına
// VITE_API_BASE_URL=https://... eklenerek backend adresi değiştirilebilir.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Her istekte token'ı otomatik ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('theragift_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 alınırsa oturumu sonlandır
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('theragift_token')
      localStorage.removeItem('theragift_user')
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/public')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
