const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'lifeway-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'Lifeway API funcionando corretamente',
    endpoints: ['/health', '/api/status', '/api/dreams', '/api/visa-match'],
    status: 'operational'
  });
});

// Dreams endpoint (placeholder)
app.get('/api/dreams', (req, res) => {
  res.json({ 
    message: 'Criador de Sonhos endpoint',
    dreams: [],
    status: 'ready'
  });
});

// Visa Match endpoint (placeholder)
app.get('/api/visa-match', (req, res) => {
  res.json({ 
    message: 'VisaMatch endpoint',
    matches: [],
    status: 'ready'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lifeway USA API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      status: '/api/status',
      dreams: '/api/dreams',
      visaMatch: '/api/visa-match'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Lifeway API running on port ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  console.log(`🎯 API Status: http://localhost:${port}/api/status`);
});
