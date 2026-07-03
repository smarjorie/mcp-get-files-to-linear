import type { VercelRequest, VercelResponse } from "@vercel/node";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createIngestionServer } from "../src/server.js";

// Autenticacao simples por token de acesso ao proprio servidor MCP (opcional).
// Se MCP_ACCESS_TOKEN estiver definida, exige header Authorization: Bearer <token>.
function isAuthorized(req: VercelRequest): boolean {
  const expected = process.env.MCP_ACCESS_TOKEN;
  if (!expected) return true; // sem token configurado = aberto (nao recomendado em producao)
  const header = req.headers["authorization"];
  const token = Array.isArray(header) ? header[0] : header;
  return token === `Bearer ${expected}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthorized(req)) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Nao autorizado" },
      id: null,
    });
    return;
  }

  // Modo stateless: uma instancia de server + transport por requisicao.
  const server = createIngestionServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req as any, res as any, req.body);
  } catch (err) {
    console.error("Erro no handler MCP:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Erro interno do servidor" },
        id: null,
      });
    }
  }
}
