# Cloud Code Vault

Sistema de versionamento e organização de projetos web. Cadastre páginas, SaaS, automações N8N e projetos de IA com controle de versões, tags, uploads de código-fonte e deploy tracking.

## Stack

- **Frontend:** React 19 + TanStack Router (file-based) + TanStack Query
- **Backend/Auth/Storage:** Supabase (Postgres, Auth, Storage buckets)
- **Estilo:** Tailwind CSS v4 + shadcn/ui (Radix) com tema glassmorphism
- **Build:** Vite + Nitro (SSR) com preset Vercel
- **Deploy:** Vercel (Build Output API)

## Funcionalidades

- Autenticação via Supabase Auth (email/senha)
- Categorias: Páginas, SaaS, IA, N8N + visão "Todos"
- Cadastro de projetos com capa, links (produção/git), autor
- Sistema de tags dedicado (criar, reutilizar, filtrar)
- Versionamento com upload de .zip e changelog
- Edição e exclusão de projetos

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/) (gerenciador de pacotes)
- Conta no [Supabase](https://supabase.com/) com projeto criado

## Setup

1. Clone o repositório:

```bash
git clone https://github.com/aleanmendonca/code-vault-pages.git
cd code-vault-pages
```

2. Instale as dependências:

```bash
bun install
```

3. Configure as variáveis de ambiente — crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

4. Execute as migrations no SQL Editor do Supabase (em ordem):

```
supabase/migrations/20260527120000_add_ia_project_type.sql
supabase/migrations/20260527130000_create_tags_tables.sql
supabase/migrations/20260528120000_add_n8n_project_type.sql
```

5. Crie os buckets de Storage no Supabase:
   - `covers` — imagens de capa (público)
   - `zips` — arquivos .zip de código (privado)

6. Inicie o servidor de desenvolvimento:

```bash
bun run dev
```

O app estará disponível em `http://localhost:8080`.

## Build para produção

```bash
bun run build
```

Gera o bundle em `.vercel/output/` pronto para deploy na Vercel.

## Estrutura do projeto

```
src/
├── components/       # Componentes reutilizáveis (cards, pickers, UI)
├── hooks/            # Custom hooks (auth)
├── integrations/     # Cliente e tipos do Supabase
├── lib/              # Utilitários (tags, project-types)
├── routes/           # Rotas file-based (TanStack Router)
│   ├── _app/         # Rotas autenticadas (layout com sidebar)
│   └── __root.tsx    # Shell da aplicação
└── styles.css        # Tema Tailwind
```

## Licença

MIT

---

# Cloud Code Vault (English)

A web project versioning and organization system. Register pages, SaaS apps, N8N automations, and AI projects with version control, tags, source code uploads, and deploy tracking.

## Stack

- **Frontend:** React 19 + TanStack Router (file-based) + TanStack Query
- **Backend/Auth/Storage:** Supabase (Postgres, Auth, Storage buckets)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix) with glassmorphism theme
- **Build:** Vite + Nitro (SSR) with Vercel preset
- **Deploy:** Vercel (Build Output API)

## Features

- Authentication via Supabase Auth (email/password)
- Categories: Pages, SaaS, AI, N8N + "All" view
- Project registration with cover image, links (production/git), author
- Dedicated tag system (create, reuse, filter)
- Versioning with .zip upload and changelog
- Project editing and deletion

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Bun](https://bun.sh/) (package manager)
- [Supabase](https://supabase.com/) account with a project created

## Setup

1. Clone the repository:

```bash
git clone https://github.com/aleanmendonca/code-vault-pages.git
cd code-vault-pages
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables — create a `.env` file at the root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the migrations in the Supabase SQL Editor (in order):

```
supabase/migrations/20260527120000_add_ia_project_type.sql
supabase/migrations/20260527130000_create_tags_tables.sql
supabase/migrations/20260528120000_add_n8n_project_type.sql
```

5. Create Storage buckets in Supabase:
   - `covers` — cover images (public)
   - `zips` — source code .zip files (private)

6. Start the development server:

```bash
bun run dev
```

The app will be available at `http://localhost:8080`.

## Production build

```bash
bun run build
```

Outputs to `.vercel/output/` ready for Vercel deployment.

## Project structure

```
src/
├── components/       # Reusable components (cards, pickers, UI)
├── hooks/            # Custom hooks (auth)
├── integrations/     # Supabase client and types
├── lib/              # Utilities (tags, project-types)
├── routes/           # File-based routes (TanStack Router)
│   ├── _app/         # Authenticated routes (sidebar layout)
│   └── __root.tsx    # App shell
└── styles.css        # Tailwind theme
```

## License

MIT
