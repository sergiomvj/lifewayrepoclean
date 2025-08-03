# 📁 LifeWay USA - Storage Service

## Descrição
Serviço de arquivos estáticos, uploads e arquivos gerados do LifeWay USA deployado no Easypanel.

## 🚀 Deploy Information
- **URL**: https://storage.lifewayusa.app
- **Repository**: https://github.com/sergiomvj/lifewayrepoclean.git
- **Branch**: storage
- **Build Format**: Dockerfile
- **Technology**: Nginx Alpine

## Estrutura
```
5-storage/
├── images/
│   ├── family/         # Imagens de famílias para PDFs
│   ├── destinations/   # Imagens de destinos
│   └── ui/             # Ícones e elementos UI
├── uploads/
│   ├── profiles/       # Fotos de perfil dos usuários
│   └── documents/      # Documentos enviados
└── generated/
    ├── pdfs/           # PDFs gerados pelo sistema
    └── reports/        # Relatórios gerados
```

## Configuração Nginx
- **Imagens públicas**: Acesso livre com cache longo
- **Uploads**: Acesso restrito com autenticação
- **Arquivos gerados**: Acesso restrito por usuário

## Segurança
- Verificação de autenticação para arquivos privados
- Rate limiting para uploads
- Validação de tipos de arquivo
- Proteção contra path traversal

## Backup
- Backup automático diário
- Compressão de arquivos antigos
- Retenção configurável

## Deploy
```bash
./deploy-storage.sh
```

## Configuração de Permissões
```bash
# Definir proprietário
sudo chown -R www-data:www-data /var/www/storage

# Definir permissões
sudo chmod -R 755 /var/www/storage
```

## Monitoramento
- Uso de espaço em disco
- Logs de acesso
- Alertas de quota
