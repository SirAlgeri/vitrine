# 📚 Índice da Documentação - Vitrine Pro

Guia completo de toda a documentação disponível.

## 🎯 Começando

### Para Novos Usuários
1. **[README.md](README.md)** - Comece aqui! Visão geral do projeto
2. **[SETUP.md](SETUP.md)** - Guia passo a passo de instalação
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Comandos e informações essenciais

### Para Desenvolvedores
1. **[DOCUMENTACAO.md](DOCUMENTACAO.md)** - Documentação técnica completa
2. **[STATUS_PADRONIZACAO.md](STATUS_PADRONIZACAO.md)** - Sistema de status
3. **[CHANGELOG.md](CHANGELOG.md)** - Histórico de mudanças

## 📖 Documentação por Categoria

### 🚀 Instalação e Configuração

**[SETUP.md](SETUP.md)**
- Pré-requisitos
- Instalação do banco de dados
- Configuração de variáveis de ambiente
- Criação do usuário admin
- Inicialização do sistema
- Primeiros passos

**[database/INSTALL.md](database/INSTALL.md)**
- Instalação do PostgreSQL (Ubuntu/Windows/macOS/Docker)
- Criação do banco de dados
- Execução de migrations
- Configuração de timezone
- Estrutura completa do banco
- Verificação da instalação

**[DOCKER_SETUP.md](DOCKER_SETUP.md)**
- Configuração com Docker
- Docker Compose
- Comandos úteis do Docker

### 🏗️ Arquitetura e Desenvolvimento

**[DOCUMENTACAO.md](DOCUMENTACAO.md)**
- Visão geral do sistema
- Estrutura do projeto
- Funcionalidades detalhadas
- Guia de uso completo
- API Backend (todos os endpoints)
- Esquema do banco de dados
- Personalização

**[STATUS_PADRONIZACAO.md](STATUS_PADRONIZACAO.md)**
- Sistema de status padronizado
- Enums de PaymentStatus e OrderStatus
- Mapeamento automático de status
- Componentes visuais (StatusBadge, OrderTimeline)
- Histórico de mudanças de status
- Validação de transições

### 💳 Pagamentos

**[MERCADOPAGO.md](MERCADOPAGO.md)**
- Integração com Mercado Pago
- Configuração de credenciais
- Pagamento com PIX
- Pagamento com Cartão de Crédito
- Pagamento com Boleto
- Webhooks
- Mapeamento de status

### 🚀 Deploy

**[DEPLOY_EC2.md](DEPLOY_EC2.md)**
- Deploy na AWS EC2
- Configuração do servidor
- Nginx como reverse proxy
- PM2 para gerenciamento de processos
- SSL/HTTPS
- Domínio customizado

### 🔧 Manutenção e Suporte

**[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
- Backend não inicia
- Frontend não conecta
- Banco de dados não conecta
- Migrations falharam
- Problemas de login
- Produtos não aparecem
- Erro ao fazer upload de imagem
- Cores não aplicam
- WhatsApp não abre
- Erro ao gerar boleto
- Endereço não aparece
- Timezone errado
- Comandos úteis para debug
- Como resetar o sistema

**[QUICK_REFERENCE.md](QUICK_REFERENCE.md)**
- Comandos para iniciar o sistema
- Credenciais padrão
- Endpoints principais
- Status do sistema
- Comandos do banco
- Comandos de manutenção
- Backup e restore
- Problemas comuns (tabela resumida)

**[CHANGELOG.md](CHANGELOG.md)**
- Histórico completo de mudanças
- Versão 2026-02-09: Melhorias na área do cliente
- Versão 2026-02-08: Sistema de status e gestão de pedidos
- Funcionalidades base

### 📝 Outros

**[UPDATE_PURCHASE.md](UPDATE_PURCHASE.md)**
- Atualizações específicas do sistema de compras

## 🗺️ Fluxo de Leitura Recomendado

### Para Instalação Inicial
```
1. README.md (visão geral)
2. SETUP.md (instalação passo a passo)
3. database/INSTALL.md (configuração do banco)
4. QUICK_REFERENCE.md (comandos essenciais)
```

### Para Desenvolvimento
```
1. DOCUMENTACAO.md (arquitetura completa)
2. STATUS_PADRONIZACAO.md (sistema de status)
3. MERCADOPAGO.md (integração de pagamentos)
4. CHANGELOG.md (mudanças recentes)
```

### Para Deploy em Produção
```
1. DEPLOY_EC2.md (deploy na AWS)
2. DOCKER_SETUP.md (containerização)
3. TROUBLESHOOTING.md (solução de problemas)
```

### Para Solução de Problemas
```
1. TROUBLESHOOTING.md (problemas comuns)
2. QUICK_REFERENCE.md (comandos úteis)
3. CHANGELOG.md (verificar mudanças recentes)
```

## 📊 Resumo dos Documentos

| Documento | Páginas | Última Atualização | Propósito |
|-----------|---------|-------------------|-----------|
| README.md | 1 | 2026-02-09 | Visão geral e início rápido |
| SETUP.md | 2 | 2026-02-09 | Guia de instalação completo |
| DOCUMENTACAO.md | 15+ | 2026-02-09 | Documentação técnica detalhada |
| STATUS_PADRONIZACAO.md | 5+ | 2026-02-08 | Sistema de status |
| MERCADOPAGO.md | 3+ | 2026-02-08 | Integração de pagamentos |
| TROUBLESHOOTING.md | 8+ | 2026-02-09 | Solução de problemas |
| QUICK_REFERENCE.md | 3 | 2026-02-09 | Referência rápida |
| CHANGELOG.md | 3 | 2026-02-09 | Histórico de mudanças |
| database/INSTALL.md | 4 | 2026-02-09 | Instalação do banco |
| DEPLOY_EC2.md | 5+ | Anterior | Deploy em produção |
| DOCKER_SETUP.md | 2 | Anterior | Configuração Docker |

## 🔍 Busca Rápida

### Preciso saber como...

**Instalar o sistema**
→ [SETUP.md](SETUP.md)

**Configurar o banco de dados**
→ [database/INSTALL.md](database/INSTALL.md)

**Entender a arquitetura**
→ [DOCUMENTACAO.md](DOCUMENTACAO.md)

**Integrar pagamentos**
→ [MERCADOPAGO.md](MERCADOPAGO.md)

**Resolver um problema**
→ [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**Ver comandos úteis**
→ [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**Fazer deploy**
→ [DEPLOY_EC2.md](DEPLOY_EC2.md)

**Ver o que mudou**
→ [CHANGELOG.md](CHANGELOG.md)

**Entender os status**
→ [STATUS_PADRONIZACAO.md](STATUS_PADRONIZACAO.md)

## 📞 Suporte

Se não encontrar o que procura:

1. Use Ctrl+F para buscar palavras-chave nos documentos
2. Consulte o [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Verifique o [CHANGELOG.md](CHANGELOG.md) para mudanças recentes
4. Consulte a [QUICK_REFERENCE.md](QUICK_REFERENCE.md) para comandos

## 🎯 Documentos Mais Acessados

1. **[SETUP.md](SETUP.md)** - Instalação
2. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemas
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Comandos
4. **[DOCUMENTACAO.md](DOCUMENTACAO.md)** - Referência técnica
5. **[STATUS_PADRONIZACAO.md](STATUS_PADRONIZACAO.md)** - Sistema de status

---

**Última atualização:** 2026-02-09  
**Total de documentos:** 11  
**Páginas totais:** ~50+
