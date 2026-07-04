import { Component } from 'react'

// V2.2A.2: "Önümüzdeki 4 hafta" gibi aksiyonlarda beklenmeyen bir hata olursa
// tüm uygulamanın beyaz sayfaya düşmesini engellemek için genel amaçlı bir
// güvenlik ağı. React'te error boundary'ler yalnızca class component olarak
// yazılabilir (hook karşılığı yok) — bu yüzden burada bilinçli olarak class
// kullanılıyor. Bu bölge dışındaki hiçbir sayfa/akış etkilenmez.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Sessizce yutmuyoruz — en azından konsola düşsün ki geliştirici görebilsin.
    console.error('ErrorBoundary yakaladı:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-800">
          <p className="font-semibold mb-2">Bu bölüm yüklenirken beklenmeyen bir hata oluştu.</p>
          <p className="text-xs text-red-700 mb-3">Sayfanın geri kalanı çalışmaya devam ediyor. Tekrar denemek için aşağıdaki butonu kullanabilirsiniz.</p>
          <button
            type="button"
            onClick={this.handleReset}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-300 hover:bg-red-100 transition-colors"
          >
            Tekrar dene
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
