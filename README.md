# 🎨 LifeWay USA - Frontend

## Descrição
Interface React/Vite do LifeWay USA com todas as funcionalidades principais.

## Funcionalidades
- Dashboard personalizado
- Criador de Sonhos
- VisaMatch com IA
- Chat com Especialista
- Sistema de gamificação
- Geração de PDF
- Sistema de perfil completo

## Tecnologias
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI
- React Query
- Supabase
- OpenAI Integration

## Estrutura
```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas da aplicação
├── hooks/          # Hooks customizados
├── services/       # Serviços (API, Supabase)
├── utils/          # Utilitários
└── types/          # Tipos TypeScript
```

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
Configure no `.env.production`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- `VITE_OPENAI_API_KEY`

## Deploy
```bash
./deploy-frontend.sh
```

## Páginas Principais
- `/` - Homepage
- `/dashboard` - Dashboard unificado
- `/dreams` - Criador de Sonhos
- `/visamatch` - Análise de Visto
- `/especialista` - Chat com Especialista
- `/profile` - Perfil do usuário
