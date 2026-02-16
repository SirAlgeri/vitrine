# 🎨 Sistema de Cores Personalizadas - Vitrine Pro

## Visão Geral

Sistema completo de personalização de cores que permite customizar 90% da interface através do painel administrativo.

## Cores Disponíveis

### 1. **Background** (`--color-background`)
- Cor de fundo principal da aplicação
- Padrão: `#0f172a` (azul escuro)
- Uso: Fundo geral da página

### 2. **Card** (`--color-card`)
- Cor de fundo dos cards/containers
- Padrão: `#1e293b` (azul médio)
- Uso: Cards de produtos, formulários, painéis

### 3. **Surface** (`--color-surface`)
- Cor de superfícies elevadas
- Padrão: `#334155` (azul claro)
- Uso: Inputs, selects, áreas de destaque

### 4. **Texto Principal** (`--color-text-primary`)
- Cor do texto principal
- Padrão: `#ffffff` (branco)
- Uso: Títulos, textos importantes

### 5. **Texto Secundário** (`--color-text-secondary`)
- Cor do texto secundário
- Padrão: `#94a3b8` (cinza claro)
- Uso: Descrições, labels, textos auxiliares

### 6. **Bordas** (`--color-border`)
- Cor das bordas
- Padrão: `#475569` (cinza médio)
- Uso: Bordas de inputs, cards, divisores

### 7. **Botão Primário** (`--color-button-primary`)
- Cor dos botões principais
- Padrão: `#3b82f6` (azul)
- Uso: Botões de ação principal

### 8. **Botão Primário Hover** (`--color-button-primary-hover`)
- Cor dos botões principais ao passar o mouse
- Padrão: `#2563eb` (azul escuro)

### 9. **Botão Secundário** (`--color-button-secondary`)
- Cor dos botões secundários
- Padrão: `#64748b` (cinza)
- Uso: Botões de ação secundária

### 10. **Botão Secundário Hover** (`--color-button-secondary-hover`)
- Cor dos botões secundários ao passar o mouse
- Padrão: `#475569` (cinza escuro)

---

## Como Usar

### No Painel Admin

1. Acesse `/admin`
2. Clique no ícone de **Configurações** (⚙️)
3. Role até a seção **"🎨 Personalização de Cores"**
4. Clique em cada cor para abrir o seletor
5. Escolha a cor desejada
6. Clique em **"Salvar Alterações"**
7. As cores serão aplicadas instantaneamente!

### No Código (CSS)

Use as variáveis CSS diretamente:

```css
.meu-componente {
  background-color: var(--color-card);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```

### No Código (Classes Tailwind)

Use as classes utilitárias criadas:

```tsx
<div className="bg-custom-card text-custom-primary border-custom">
  Conteúdo
</div>

<button className="bg-custom-btn-primary hover:bg-custom-btn-primary-hover">
  Clique aqui
</button>
```

---

## Cores NÃO Personalizáveis

Por questões de UX e acessibilidade, as seguintes cores **NÃO** são customizáveis:

- ✅ **Verde** - Sucesso, confirmações, salvar
- ❌ **Vermelho** - Erros, exclusões, cancelar
- ⚠️ **Amarelo** - Avisos, alertas
- ℹ️ **Azul** - Informações

---

## Banco de Dados

### Tabela: `config`

Campos adicionados:

```sql
background_color VARCHAR(7)
card_color VARCHAR(7)
surface_color VARCHAR(7)
text_primary_color VARCHAR(7)
text_secondary_color VARCHAR(7)
border_color VARCHAR(7)
button_primary_color VARCHAR(7)
button_primary_hover_color VARCHAR(7)
button_secondary_color VARCHAR(7)
button_secondary_hover_color VARCHAR(7)
```

### Migration

Arquivo: `database/migration-theme-colors.sql`

Execute:
```bash
docker exec vitrinepro-postgres psql -U postgres -d vitrinepro < database/migration-theme-colors.sql
```

---

## Arquitetura

### 1. **ThemeProvider** (`components/ThemeProvider.tsx`)
- Componente React que aplica as cores dinamicamente
- Atualiza as variáveis CSS do `:root`
- Reage a mudanças no `config`

### 2. **Variáveis CSS** (`index.css`)
- Define as variáveis CSS globais
- Valores padrão caso não haja customização

### 3. **Backend** (`backend/server.js`)
- Endpoint `PUT /api/config` atualizado
- Salva todas as cores no banco
- Retorna cores no `GET /api/config`

### 4. **Frontend** (`App.tsx`)
- Carrega cores do backend
- Passa para o `ThemeProvider`
- Aplica em toda a aplicação

---

## Exemplo de Uso Completo

```tsx
// 1. No AdminDashboard, usuário escolhe cores
// 2. Salva no banco via PUT /api/config
// 3. App.tsx carrega via GET /api/config
// 4. ThemeProvider aplica no :root
// 5. Toda a aplicação usa as novas cores!

// Componente usando cores customizadas:
<div className="bg-custom-card border-custom rounded-lg p-4">
  <h2 className="text-custom-primary">Título</h2>
  <p className="text-custom-secondary">Descrição</p>
  <button className="bg-custom-btn-primary hover:bg-custom-btn-primary-hover">
    Ação
  </button>
</div>
```

---

## Dicas de Personalização

### Tema Claro
```
Background: #ffffff
Card: #f8fafc
Surface: #e2e8f0
Texto Principal: #1e293b
Texto Secundário: #64748b
Bordas: #cbd5e1
```

### Tema Escuro (Padrão)
```
Background: #0f172a
Card: #1e293b
Surface: #334155
Texto Principal: #ffffff
Texto Secundário: #94a3b8
Bordas: #475569
```

### Tema Roxo
```
Background: #1a0b2e
Card: #2d1b4e
Surface: #3e2a5e
Botão Primário: #8b5cf6
Botão Primário Hover: #7c3aed
```

---

## Suporte

Para dúvidas ou problemas com o sistema de cores, consulte este documento ou abra uma issue.

**Versão:** 2.1  
**Data:** 2026-02-16
