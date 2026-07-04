import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
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
