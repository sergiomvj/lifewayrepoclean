import React from 'react';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1a1a1a',
          marginBottom: '20px'
        }}>
          LifeWay USA - Admin Panel
        </h1>
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          ✅ Status: Admin Panel Online
        </div>
        <p style={{
          color: '#666',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '30px'
        }}>
          Bem-vindo ao painel administrativo do LifeWay USA.
        </p>
        <div>
          <button style={{
            backgroundColor: '#007bff',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            margin: '5px'
          }}>
            Dashboard
          </button>
          <button style={{
            backgroundColor: '#28a745',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: 'pointer',
            margin: '5px'
          }}>
            Usuários
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
