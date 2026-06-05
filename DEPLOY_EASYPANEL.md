# Deploy no EasyPanel (Método GitHub)

Este guia explica como fazer deploy do Code Vault no EasyPanel usando integração direta com GitHub - **sem precisar de GitHub Actions**.

O EasyPanel cuida de tudo: clona o repositório, faz build via Dockerfile, e deploy automaticamente a cada push na branch `main`.

---

## Pré-requisitos

- Conta no [EasyPanel](https://easypanel.io/)
- Repositório no GitHub: `https://github.com/aleanmendonca/code-vault-pages`
- Docker Desktop (apenas para teste local)

---

## Passo 1: Subir o Código para o GitHub

Se ainda não subiu as mudanças:

```powershell
# No diretório do projeto
git add .
git commit -m "feat: preparar deploy para EasyPanel"
git push origin main
```

Pronto. O EasyPanel vai ler deste repositório.

---

## Passo 2: Criar Projeto no EasyPanel

1. Acesse [easypanel.io](https://easypanel.io) e faça login
2. Clique em **New Project**
3. Escolha **Empty Project**
4. Nomeie como `cloud-code-vault`

---

## Passo 3: Adicionar o Banco PostgreSQL

1. No painel do projeto, clique em **+ Service** ou **Add Service**
2. Selecione **Database** → **PostgreSQL**
3. Configure:
   - **Service Name**: `postgres`
   - **Image**: `postgres:16-alpine` (deixe o padrão)
   - **Password**: Defina uma senha forte (ex: `MinhaSenh@2024!`)
4. Em **Environment Variables**, confirme:
   - `POSTGRES_USER=postgres`
   - `POSTGRES_PASSWORD=` (a senha que você definiu)
   - `POSTGRES_DB=cloudcodevault`
5. Em **Volumes**, adicione:
   - Host: `pgdata` → Container: `/var/lib/postgresql/data`
6. **Deploy**

Após deploy, copie a **Connection String** que aparece nos detalhes do serviço. Será algo como:
```
postgresql://postgres:SUA_SENHA@postgres:5432/cloudcodevault
```

---

## Passo 4: Adicionar a Aplicação

1. No painel do projeto, clique em **+ Service** → **App**
2. Selecione a aba **GitHub** ← você está aqui
3. Configure:
   - **Repository**: `aleanmendonca/code-vault-pages`
   - **Branch**: `main`
   - **Build Method**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile` (padrão)
   - **Port**: `3000`

### 4.1 Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres:SUA_SENHA@postgres:5432/cloudcodevault` |
| `JWT_SECRET` | Cole uma string aleatória de 64 caracteres (gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `UPLOAD_DIR` | `/app/uploads` |

### 4.2 Volumes Persistentes

Para não perder uploads ao re-deploy, adicione um volume:
- **Mount Path**: `/app/uploads`
- Marque como volume persistente (o EasyPanel vai gerenciar)

### 4.3 Health Check

- **Path**: `/api/health`
- **Port**: `3000`

### 4.4 Domínio

- Em **Domains**, adicione seu domínio ou use o subdomínio padrão do EasyPanel
- O EasyPanel vai gerar SSL automaticamente

5. Clique em **Deploy**

---

## Passo 5: Rodar Migrações do Banco

Após o primeiro deploy, você precisa criar as tabelas. Há duas formas:

### Opção A: Pelo Terminal do EasyPanel

1. Vá no serviço da aplicação no EasyPanel
2. Abra o **Terminal** (ou **Console**)
3. Execute:
   ```bash
   node node_modules/drizzle-kit/bin.cjs push
   ```
   Ou:
   ```bash
   npx drizzle-kit push
   ```

### Opção B: Adicionar como Comando de Inicialização

Edite o `CMD` no Dockerfile para rodar migrações antes de iniciar (veja seção "Migração Automática" abaixo).

---

## Passo 6: Deploy Automático ✅

Depois de configurado, **toda vez que você fizer push para `main`**, o EasyPanel:

1. Detecta o push via webhook do GitHub
2. Faz pull do código novo
3. Reconstrói a imagem Docker
4. Faz deploy da nova versão
5. Mantém o banco de dados intacto (volume persistente)

Para confirmar, faça uma mudança e:
```powershell
git add .
git commit -m "test: deploy automático"
git push origin main
```

Vá na aba **Deployments** do EasyPanel e veja o deploy acontecendo.

---

## Migração Automática (Opcional)

Para rodar migrações automaticamente a cada deploy, atualize o `Dockerfile`:

```dockerfile
# Trocar esta linha no final do Dockerfile:
CMD ["sh", "-c", "node node_modules/drizzle-kit/bin.cjs push && node dist/server.js"]
```

> ⚠️ Cuidado: isso pode falhar se a migração já foi aplicada. Use apenas no primeiro deploy ou com `drizzle-kit migrate` que é idempotente.

---

## Comandos Úteis no Terminal do EasyPanel

```bash
# Ver logs em tempo real
docker logs -f cloud-code-vault-app-1

# Conectar ao banco
docker exec -it cloud-code-vault-postgres-1 psql -U postgres -d cloudcodevault

# Rodar migrações manualmente
npx drizzle-kit push

# Verificar saúde da app
curl http://localhost:3000/api/health
```

*(Os nomes exatos dos containers podem variar - veja a aba Containers no EasyPanel)*

---

## Solução de Problemas

### ❌ Container reiniciando em loop

**Causa mais comum**: `DATABASE_URL` errada ou banco não está pronto.

1. Verifique os logs do app
2. Confirme que o serviço `postgres` está com status `Running`
3. Teste a connection string - o host interno é o **nome do serviço** (`postgres`), não `localhost`

### ❌ Erro "Cannot find module @node-rs/argon2"

O `@node-rs/argon2` precisa de binário nativo. O Dockerfile já instala `openssl`, mas em casos raros:

1. Verifique se a build está usando o `Dockerfile` e não apenas `npm start`
2. O build multi-stage garante que o binário é compilado para a imagem runner

### ❌ Push no GitHub não dispara deploy

1. No EasyPanel, vá em **Settings** → **GitHub** → verifique se a autorização está ativa
2. Pode ser que a primeira vez precise reconectar a conta GitHub
3. Vá em **Deployments** → **Triggers** → confirme que está monitorando `main`

### ❌ Porta 3000 não responde

O Nitro/Express pode estar escutando em outra porta. Confirme que a env `PORT=3000` está definida.

---

## Estrutura Final do Projeto

```
cloud-code-vault/
├── Dockerfile              # Build multi-stage
├── .dockerignore           # Exclui arquivos desnecessários do build
├── docker-compose.yml      # Para desenvolvimento local
├── drizzle.config.ts       # Configuração do Drizzle ORM
├── src/
│   ├── db/
│   │   ├── client.ts       # Conexão com banco
│   │   └── schema.ts       # Schema das tabelas
│   ├── lib/
│   │   └── api.server.ts   # Rotas API (incluindo /api/health)
│   └── server.ts           # Entry point do servidor
└── package.json
```

---

## Vantagens deste Método

✅ **Zero configuração de CI/CD** - EasyPanel faz tudo
✅ **Webhooks automáticos** - Push no GitHub = deploy
✅ **SSL grátis** - Let's Encrypt automático
✅ **Volumes persistentes** - Uploads e banco não se perdem
✅ **Rollback fácil** - Cada deploy fica salvo, é só voltar