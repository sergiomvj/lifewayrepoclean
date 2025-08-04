# Lifeway USA API

Express.js backend API for the Lifeway USA platform.

## Quick Fix Version

This is a minimal working version created to resolve the `Cannot find module '/app/dist/server.js'` error.

## Endpoints

- `GET /` - API info and available endpoints
- `GET /health` - Health check endpoint
- `GET /api/status` - API status
- `GET /api/dreams` - Dreams endpoint (placeholder)
- `GET /api/visa-match` - Visa Match endpoint (placeholder)

## Running

```bash
npm install
npm start
```

## Docker

```bash
docker build -t lifeway-api .
docker run -p 3000:3000 lifeway-api
```

## Status

✅ Resolves server.js crash issue
✅ Provides basic API endpoints
✅ Ready for Easypanel deployment
