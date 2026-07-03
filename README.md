# MCP Ingestion Server

Servidor MCP (Model Context Protocol) que expõe ferramentas de **leitura/consulta** para três fontes de dados:

- **Notion** — busca e leitura de páginas
- **Google Docs** — busca e leitura de documentos (via Service Account)
- **Linear** — busca e leitura de issues, listagem de times

Roda como função serverless na **Vercel**, usando transporte HTTP (Streamable HTTP) do MCP.

## Ferramentas expostas

| Tool | Descrição |
|---|---|
| `notion_search` | Busca páginas/databases no Notion por texto |
| `notion_get_page` | Lê o conteúdo de uma página do Notion |
| `gdocs_search` | Busca Google Docs por texto |
| `gdocs_get_document` | Lê o conteúdo de um Google Doc |
| `linear_search_issues` | Busca issues no Linear |
| `linear_get_issue` | Lê detalhes de uma issue |
| `linear_list_teams` | Lista os times do workspace |

---

## 1. Credenciais necessárias

### Notion
1. Acesse https://www.notion.so/my-integrations e crie uma **New integration**.
2. Copie o **Internal Integration Secret** → esse é o `NOTION_API_KEY`.
3. Em cada página/database que você quer disponibilizar, clique em `...` → **Connections** → adicione a integração criada. Sem isso, a busca não retorna nada.

### Google Docs (via Service Account — não exige login do usuário)
1. No [Google Cloud Console](https://console.cloud.google.com/), crie (ou use) um projeto.
2. Ative as APIs: **Google Docs API** e **Google Drive API**.
3. Em **IAM & Admin → Service Accounts**, crie uma service account.
4. Gere uma chave (tipo JSON) para ela e baixe o arquivo.
5. Do JSON, você vai usar:
   - `client_email` → `GOOGLE_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY` (mantenha as quebras de linha como `\n` literais ao colar na Vercel)
6. **Compartilhe** cada Google Doc que quiser consultar com o e-mail da service account (como se fosse compartilhar com uma pessoa, permissão de leitura já basta).

### Linear
1. Em Linear, vá em **Settings → Security & access → API**.
2. Crie uma **Personal API Key** → `LINEAR_API_KEY`.

### Proteção do próprio servidor (recomendado)
Defina `MCP_ACCESS_TOKEN` com um valor secreto qualquer (ex: gerado com `openssl rand -hex 32`). O endpoint vai exigir o header `Authorization: Bearer <valor>` em toda chamada. Sem essa variável, o endpoint fica aberto para qualquer um que tiver a URL.

---

## 2. Rodando localmente

```bash
npm install
cp .env.example .env.local
# preencha .env.local com as credenciais acima
npm run dev
```

Isso sobe o servidor localmente via `vercel dev` em `http://localhost:3000/api/mcp`.

---

## 3. Subir no GitHub

```bash
cd mcp-ingestion-server
git init
git add .
git commit -m "mcp ingestion server: notion, google docs, linear"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/mcp-ingestion-server.git
git push -u origin main
```

> Substitua `SEU_USUARIO` pelo seu usuário/organização no GitHub. Se o repositório ainda não existe, crie-o antes (vazio, sem README) em https://github.com/new.

**Importante:** o `.env` / `.env.local` está no `.gitignore` — nenhuma credencial vai para o Git. As credenciais só devem existir nas variáveis de ambiente da Vercel (próximo passo).

---

## 4. Deploy na Vercel

### Opção A — pela interface web (mais simples)
1. Acesse https://vercel.com/new e importe o repositório do GitHub que você acabou de criar.
2. Antes de clicar em **Deploy**, abra **Environment Variables** e adicione:
   - `NOTION_API_KEY`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `LINEAR_API_KEY`
   - `MCP_ACCESS_TOKEN`
3. Clique em **Deploy**.

### Opção B — via CLI
```bash
npm i -g vercel
vercel login
vercel link
vercel env add NOTION_API_KEY
vercel env add GOOGLE_CLIENT_EMAIL
vercel env add GOOGLE_PRIVATE_KEY
vercel env add LINEAR_API_KEY
vercel env add MCP_ACCESS_TOKEN
vercel --prod
```

Ao final, sua URL será algo como:
```
https://mcp-ingestion-server.vercel.app/api/mcp
```
(o `vercel.json` também deixa disponível o atalho `/mcp`)

---

## 5. Conectando um cliente MCP à URL

Em qualquer cliente que suporte MCP via HTTP (Claude, outros agentes), configure:

- **URL**: `https://SEU-DEPLOY.vercel.app/api/mcp`
- **Header**: `Authorization: Bearer <valor do MCP_ACCESS_TOKEN>` (se você definiu essa variável)

---

## 6. Estrutura do projeto

```
mcp-ingestion-server/
├── api/
│   └── mcp.ts            # handler serverless da Vercel (transporte HTTP do MCP)
├── src/
│   ├── server.ts          # registro das tools do MCP
│   └── connectors/
│       ├── notion.ts
│       ├── googleDocs.ts
│       └── linear.ts
├── .env.example
├── vercel.json
├── package.json
└── tsconfig.json
```

## Próximos passos possíveis
- Adicionar cache (ex: Vercel KV/Redis) para reduzir chamadas repetidas às APIs.
- Trocar a Service Account do Google por OAuth de usuário, se precisar acessar docs fora do controle da service account.
- Adicionar ferramentas de escrita (ex: criar issue no Linear a partir de conteúdo do Notion) — isso muda o servidor de "somente leitura" para "leitura + ação", exigindo mais cuidado com permissões.
