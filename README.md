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


```

## Próximos passos possíveis
- Adicionar cache (ex: Vercel KV/Redis) para reduzir chamadas repetidas às APIs.
- Trocar a Service Account do Google por OAuth de usuário, se precisar acessar docs fora do controle da service account.
- Adicionar ferramentas de escrita (ex: criar issue no Linear a partir de conteúdo do Notion) — isso muda o servidor de "somente leitura" para "leitura + ação", exigindo mais cuidado com permissões.
