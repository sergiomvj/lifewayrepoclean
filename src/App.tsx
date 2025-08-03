import React from 'react';

function App() {
  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif'
  };

  const headerStyle = {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px 0'
  };

  const titleStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    margin: '0'
  };

  const mainStyle = {
    padding: '40px 20px',
    textAlign: 'center'
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '60px 20px',
    margin: '0 auto',
    maxWidth: '600px'
  };

  const subtitleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px'
  };

  const textStyle = {
    color: '#6b7280',
    marginBottom: '24px'
  };

  const badgeStyle = {
    display: 'inline-block',
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500'
  };

  return React.createElement('div', { style: containerStyle },
    React.createElement('header', { style: headerStyle },
      React.createElement('h1', { style: titleStyle },
        'LifeWay USA - Admin Panel'
      )
    ),
    React.createElement('main', { style: mainStyle },
      React.createElement('div', { style: cardStyle },
        React.createElement('h2', { style: subtitleStyle },
          'Painel Administrativo'
        ),
        React.createElement('p', { style: textStyle },
          'Sistema de administração do LifeWay USA em funcionamento!'
        ),
        React.createElement('span', { style: badgeStyle },
          '✅ Deploy Successful'
        )
      )
    )
  );
}

export default App;
