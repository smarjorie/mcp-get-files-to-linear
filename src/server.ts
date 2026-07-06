import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { notionSearch, notionGetPage, notionQueryDatabase } from "./connectors/notion.js";
import { gdocsSearch, gdocsGetDocument } from "./connectors/googleDocs.js";
import {
  linearSearchIssues,
  linearGetIssue,
  linearListTeams,
  linearCreateIssue,
  linearCreateProject,
} from "./connectors/linear.js";

function toResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function toError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Erro: ${message}` }],
  };
}

export function createIngestionServer(): McpServer {
  const server = new McpServer({
    name: "mcp-ingestion-server",
    version: "1.0.0",
  });

  // ---------- Notion ----------
  server.registerTool(
    "notion_search",
    {
      title: "Buscar no Notion",
      description: "Busca paginas e databases no Notion por texto livre.",
      inputSchema: {
        query: z.string().describe("Termo de busca"),
        pageSize: z.number().int().min(1).max(25).optional(),
      },
    },
    async ({ query, pageSize }) => {
      try {
        return toResult(await notionSearch(query, pageSize));
      } catch (err) {
        return toError(err);
      }
    }
  );

  server.registerTool(
    "notion_get_page",
    {
      title: "Ler pagina do Notion",
      description: "Le o conteudo completo (em texto) de uma pagina do Notion pelo ID.",
      inputSchema: {
        pageId: z.string().describe("ID da pagina do Notion"),
      },
    },
    async ({ pageId }) => {
      try {
        return toResult(await notionGetPage(pageId));
      } catch (err) {
        return toError(err);
      }
    }
  );

  server.registerTool(
    "notion_query_database",
    {
      title: "Consultar database do Notion",
      description:
        "Le todas as linhas de um database do Notion, retornando os campos de cada uma (select, status, texto, pessoas, data, etc).",
      inputSchema: {
        databaseId: z.string().describe("ID do database do Notion"),
        pageSize: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ databaseId, pageSize }) => {
      try {
        return toResult(await notionQueryDatabase(databaseId, pageSize));
      } catch (err) {
        return toError(err);
      }
    }
  );

  // ---------- Google Docs ----------
  server.registerTool(
    "gdocs_search",
    {
      title: "Buscar no Google Docs",
      description:
        "Busca Google Docs por texto livre (apenas documentos compartilhados com a service account).",
      inputSchema: {
        query: z.string().describe("Termo de busca"),
        pageSize: z.number().int().min(1).max(25).optional(),
      },
    },
    async ({ query, pageSize }) => {
      try {
        return toResult(await gdocsSearch(query, pageSize));
      } catch (err) {
        return toError(err);
      }
    }
  );

  server.registerTool(
    "gdocs_get_document",
    {
      title: "Ler Google Doc",
      description: "Le o conteudo completo (em texto) de um Google Doc pelo ID.",
      inputSchema: {
        documentId: z.string().describe("ID do documento (extraido da URL do Google Docs)"),
      },
    },
    async ({ documentId }) => {
      try {
        return toResult(await gdocsGetDocument(documentId));
      } catch (err) {
        return toError(err);
      }
    }
  );

  // ---------- Linear ----------
  server.registerTool(
    "linear_search_issues",
    {
      title: "Buscar issues no Linear",
      description: "Busca issues no Linear por texto livre (titulo/descricao).",
      inputSchema: {
        query: z.string().describe("Termo de busca"),
        first: z.number().int().min(1).max(25).optional(),
      },
    },
    async ({ query, first }) => {
      try {
        return toResult(await linearSearchIssues(query, first));
      } catch (err) {
        return toError(err);
      }
    }
  );

  server.registerTool(
    "linear_get_issue",
    {
      title: "Ler issue do Linear",
      description: "Le os detalhes de uma issue do Linear pelo ID ou identifier (ex: ENG-123).",
      inputSchema: {
        issueId: z.string().describe("ID ou identifier da issue (ex: ENG-123)"),
      },
    },
    async ({ issueId }) => {
      try {
        return toResult(await linearGetIssue(issueId));
      } catch (err) {
        return toError(err);
      }
    }
  );

  server.registerTool(
    "linear_list_teams",
    {
      title: "Listar times do Linear",
      description: "Lista os times disponiveis no workspace do Linear conectado.",
      inputSchema: {},
    },
    async () => {
      try {
        return toResult(await linearListTeams());
      } catch (err) {
        return toError(err);
      }
    }
  );

  server.registerTool(
    "linear_create_issue",
    {
      title: "Criar issue no Linear",
      description:
        "Cria uma nova issue em um time do Linear. Aceita o id (uuid) ou a key do time (ex: BLI2). Opcionalmente coloca a issue dentro de um projeto (projectId) e/ou como sub-issue de outra (parentId).",
      inputSchema: {
        teamId: z.string().describe("ID ou key do time (ex: BLI2)"),
        title: z.string().describe("Titulo da issue"),
        description: z.string().optional().describe("Descricao/corpo da issue (markdown)"),
        projectId: z.string().optional().describe("ID do projeto Linear (opcional, para agrupar a issue dentro de um projeto)"),
        parentId: z.string().optional().describe("ID da issue pai (opcional, para criar esta issue como sub-issue)"),
      },
    },
    async ({ teamId, title, description, projectId, parentId }) => {
      try {
        return toResult(await linearCreateIssue(teamId, title, description, projectId, parentId));
      } catch (err) {
        return toError(err);
      }
    }
  );

  server.registerTool(
    "linear_create_project",
    {
      title: "Criar projeto no Linear",
      description:
        "Cria um novo projeto associado a um time do Linear. Aceita o id (uuid) ou a key do time (ex: BLI2). Retorna o projectId, usado depois em linear_create_issue.",
      inputSchema: {
        teamId: z.string().describe("ID ou key do time (ex: BLI2)"),
        name: z.string().describe("Nome do projeto"),
        description: z.string().optional().describe("Descricao do projeto"),
      },
    },
    async ({ teamId, name, description }) => {
      try {
        return toResult(await linearCreateProject(teamId, name, description));
      } catch (err) {
        return toError(err);
      }
    }
  );

  return server;
}
