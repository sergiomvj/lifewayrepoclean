# 🏗️ LifeWay USA - Admin Panel

## Descrição
Painel administrativo para gestão de usuários, configurações e analytics do LifeWay USA.

## Funcionalidades
- Dashboard de analytics
- Gestão de usuários
- Configurações do sistema
- Relatórios e métricas
- Monitoramento de atividades

## Tecnologias
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- Recharts
- Supabase

## Instalação
```bash
npm install
```

## Desenvolvimento
```bash
npm run dev
```

## Build para Produção
```bash
npm run build
```

## Variáveis de Ambiente
Copie `.env.production` e configure:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `VITE_API_BASE_URL`
- `VITE_ADMIN_SECRET_KEY`

## Deploy
```bash
./deploy-admin.sh
```
