# 🚗 ChatMarne - Backend API

Plataforma de IA treinável para vendedores de carros que responde automaticamente clientes via WhatsApp.

## 🚀 Como Rodar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

| Variável | Descrição | Obrigatório |
|----------|-----------|:-----------:|
| `PORT` | Porta do servidor | Não (padrão: 3000) |
| `JWT_SECRET` | Chave secreta para tokens | **Sim** |
| `OPENAI_API_KEY` | Chave da API OpenAI | Para IA funcionar |
| `ZAPI_INSTANCE_ID` | ID da instância Z-API | Para WhatsApp |
| `ZAPI_TOKEN` | Token Z-API | Para WhatsApp |
| `SUPABASE_URL` | URL do projeto Supabase | Não (usa memória) |
| `SUPABASE_KEY` | Chave anon do Supabase | Não (usa memória) |
| `ADMIN_EMAIL` | Email do admin master | Sim |

### 3. Iniciar o Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

O servidor vai iniciar em `http://localhost:3000`.

---

## 📋 Endpoints da API

### Health Check
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Status do servidor |
| `GET` | `/api/routes` | Lista todas as rotas |

### Autenticação
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `POST` | `/api/auth/register` | ❌ | Cadastro (7 dias grátis) |
| `POST` | `/api/auth/login` | ❌ | Login |
| `GET` | `/api/auth/me` | ✅ | Perfil do usuário |

### Configuração da IA
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `POST` | `/api/ai-config` | ✅ | Criar config da IA |
| `GET` | `/api/ai-config` | ✅ | Obter config |
| `PUT` | `/api/ai-config/:id` | ✅ | Atualizar config |

### Treinamento
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `POST` | `/api/training` | ✅ | Adicionar treinamento |
| `GET` | `/api/training` | ✅ | Listar treinamentos |
| `DELETE` | `/api/training/:id` | ✅ | Remover treinamento |

### Produtos/Veículos
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `POST` | `/api/products` | ✅ | Cadastrar produto |
| `GET` | `/api/products` | ✅ | Listar produtos |
| `PUT` | `/api/products/:id` | ✅ | Atualizar produto |
| `DELETE` | `/api/products/:id` | ✅ | Remover produto |

### Mensagens
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/api/messages` | ✅ | Histórico de mensagens |
| `PUT` | `/api/messages/:id/correct` | ✅ | Corrigir resposta da IA |

### Webhook WhatsApp
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `POST` | `/api/webhook` | ❌ | Recebe mensagens do Z-API |

### Planos
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/api/plans` | ❌ | Listar planos |
| `POST` | `/api/plans/apply-coupon` | ✅ | Aplicar cupom |

### Admin Master
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/api/admin/users` | 🔒 | Listar usuários |
| `PUT` | `/api/admin/users/:id/grant-access` | 🔒 | Liberar acesso |
| `POST` | `/api/admin/coupons` | 🔒 | Criar cupom |
| `GET` | `/api/admin/coupons` | 🔒 | Listar cupons |
| `DELETE` | `/api/admin/coupons/:id` | 🔒 | Remover cupom |
| `GET` | `/api/admin/dashboard` | 🔒 | Dashboard |

### Gamificação
| Método | Rota | Auth | Descrição |
|--------|------|:----:|-----------|
| `GET` | `/api/gamification/status` | ✅ | Status XP/Nível |

> ✅ = JWT necessário | 🔒 = JWT + Admin | ❌ = Público

---

## 📁 Estrutura do Projeto

```
├── index.js                          # Entry point
├── package.json
├── .env.example
├── README.md
└── src/
    ├── config/
    │   └── database.js               # Supabase + in-memory
    ├── middlewares/
    │   ├── auth.js                    # JWT middleware
    │   └── admin.js                   # Admin guard
    ├── models/
    │   └── schemas.js                 # SQL das tabelas
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── aiConfig.controller.js
    │   ├── training.controller.js
    │   ├── messages.controller.js
    │   ├── products.controller.js
    │   ├── webhook.controller.js
    │   ├── admin.controller.js
    │   ├── plans.controller.js
    │   └── gamification.controller.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── aiConfig.routes.js
    │   ├── training.routes.js
    │   ├── messages.routes.js
    │   ├── products.routes.js
    │   ├── webhook.routes.js
    │   ├── admin.routes.js
    │   ├── plans.routes.js
    │   └── gamification.routes.js
    └── services/
        ├── openai.service.js          # OpenAI API
        ├── zapi.service.js            # Z-API WhatsApp
        ├── ai.engine.js               # Motor de IA
        └── gamification.service.js    # Sistema de XP
```

---

## 🧪 Exemplos de Uso (cURL)

### Registrar Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@teste.com","password":"123456","cpf":"12345678900"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@teste.com","password":"123456"}'
```

### Criar Config da IA (usar token do login)
```bash
curl -X POST http://localhost:3000/api/ai-config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"ai_name":"Maria","tone":"amigável","objective":"vender","sales_strategy":"Sempre destaque os diferenciais do veículo"}'
```

### Adicionar Treinamento
```bash
curl -X POST http://localhost:3000/api/training \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"type":"text","title":"Condições de pagamento","content":"Trabalhamos com financiamento em até 60x, entrada mínima de 20%. Aceitamos troca com avaliação na hora."}'
```

### Cadastrar Veículo
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"name":"Honda Civic EXL 2024","brand":"Honda","year":2024,"price":155000,"mileage":0,"category":"Sedan","description":"Zero km, completo, com teto solar."}'
```

---

## 🔧 Banco de Dados

### Modo Desenvolvimento (Padrão)
O servidor usa um **store in-memory** automaticamente. Os dados ficam na memória enquanto o servidor está rodando — ideal para testes.

### Modo Produção (Supabase)
1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL em `src/models/schemas.js` no SQL Editor
3. Configure `SUPABASE_URL` e `SUPABASE_KEY` no `.env`

---

## 🎮 Sistema de Gamificação

| Ação | XP |
|------|:--:|
| Treinamento adicionado | +10 |
| Mensagem respondida | +5 |
| Correção humana aplicada | +20 |
| Produto cadastrado | +5 |

| Nível | XP Necessário |
|-------|:------------:|
| 🌱 Iniciante | 0 |
| 📚 Aprendiz | 100 |
| ⚡ Intermediário | 500 |
| 🔥 Avançado | 1500 |
| 🏆 Expert | 5000 |
| 👑 Mestre | 10000 |
