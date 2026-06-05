# Cloud Code Vault

Sistema de versionamento e organização de projetos web auto-hospedável. Cadastre páginas, SaaS, automações N8N e projetos de IA com controle de versões, tags, uploads de código-fonte e monitoramento GitHub.

## Stack

- **Frontend:** React 19 + TanStack Router (file-based) + TanStack Query
- **Backend:** Node.js + Nitro (SSR)
- **Banco de dados:** PostgreSQL 16 (em container Docker)
- **ORM:** Drizzle ORM
- **Auth:** JWT com argon2 (hash de senhas)
- **Storage:** Sistema de arquivos local
- **Estilo:** Tailwind CSS v4 + shadcn/ui (Radix) com tema glassmorphism
- **Deploy:** Docker + EasyPanel (ou qualquer plataforma Docker)

## Funcionalidades

- Autenticação via email/senha (JWT httpOnly cookies)
- Categorias: Páginas, SaaS, IA, N8N + visão "Todos"
- Cadastro de projetos com capa, links (produção/git), autor
- Sistema de tags dedicado (criar, reutilizar, filtrar)
- Versionamento com upload de .zip e changelog
- Edição e exclusão de projetos
- Monitoramento GitHub via webhook (auto-versionamento a cada push)
- Uploads de arquivos (capas e versões) no filesystem local

## Pré-requisitos

- [Docker](https://docker.com/) e [Docker Compose](https://docker.com/)
- Ou Node.js 20+ para desenvolvimento local

## Instalação com Docker (EasyPanel)

1. Clone o repositório:
```bash
git clone https://github.com/aleanmendonca/code-vault-pages.git
cd code-vault-pages
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env e defina JWT_SECRET (mínimo 32 caracteres)
```

3. Suba os containers:
```bash
docker-compose up -d
```

4. Acesse em `http://localhost:3000` e crie sua conta!

## Instalação manual (desenvolvimento)

1. Clone o repositório:
```bash
git clone https://github.com/aleanmendonca/code-vault-pages.git
cd code-vault-pages
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite com sua conexão PostgreSQL local
```

4. Configure o banco:
```bash
npm run db:push
```

5. Inicie o servidor:
```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `DATABASE_URL` | Conexão PostgreSQL | `postgresql://postgres:postgres@localhost:5432/cloudcodevault` |
| `JWT_SECRET` | Chave secreta para JWT (mínimo 32 chars) | - |
| `PORT` | Porta do servidor | `3000` |
| `UPLOAD_DIR` | Diretório para uploads | `./uploads` |

## Comandos do banco

```bash
npm run db:generate  # Gerar migrations
npm run db:push      # Push schema para DB
npm run db:migrate   # Executar migrations
npm run db:studio    # Abrir Drizzle Studio
```

## Build para produção

```bash
npm run build
node dist/server.js
```

Output em `.output/`.

## Estrutura do projeto

```
src/
├── auth/           # Hash (argon2), JWT, sessão (cookies)
├── components/     # Componentes reutilizáveis (cards, pickers, UI)
├── db/             # Schema Drizzle + client PostgreSQL
├── hooks/          # Custom hooks (useAuth)
├── lib/            # Utilitários (storage, API server, project-types)
├── routes/         # Rotas file-based (TanStack Router)
│   ├── _app/       # Rotas autenticadas (layout com sidebar)
│   └── __root.tsx  # Shell da aplicação
└── styles.css      # Tema Tailwind

docker-compose.yml  # Configuração Docker
Dockerfile          # Build da imagem
```

## Licença

MIT