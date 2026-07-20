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

```

## Próximos passos possíveis
- Adicionar cache (ex: Vercel KV/Redis) para reduzir chamadas repetidas às APIs.
- Trocar a Service Account do Google por OAuth de usuário, se precisar acessar docs fora do controle da service account.
- Adicionar ferramentas de escrita (ex: criar issue no Linear a partir de conteúdo do Notion) — isso muda o servidor de "somente leitura" para "leitura + ação", exigindo mais cuidado com permissões.
