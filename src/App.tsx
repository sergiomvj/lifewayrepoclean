import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🇺🇸 Lifeway USA</h1>
        <p>
          Seu caminho para realizar o sonho americano
        </p>
        <div className="features">
          <div className="feature-card">
            <h3>🎯 Criador de Sonhos</h3>
            <p>Defina e acompanhe seus objetivos nos EUA</p>
          </div>
          <div className="feature-card">
            <h3>🏢 VisaMatch</h3>
            <p>Encontre o visto ideal para seu perfil</p>
          </div>
          <div className="feature-card">
            <h3>💬 Chat Inteligente</h3>
            <p>Tire suas dúvidas sobre imigração</p>
          </div>
        </div>
        <div className="status">
          <p>✅ Frontend funcionando corretamente!</p>
          <p>🔗 Conectado aos serviços Lifeway</p>
        </div>
      </header>
    </div>
  )
}

export default App
