import { LinearClient } from "@linear/sdk";

function getClient(): LinearClient {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LINEAR_API_KEY nao configurada. Gere uma Personal API Key em Linear > Settings > Security & access > API."
    );
  }
  return new LinearClient({ apiKey });
}

/**
 * Busca issues no Linear por texto livre (titulo/descricao).
 */
export async function linearSearchIssues(query: string, first = 15) {
  const linear = getClient();
  const result = await linear.searchIssues(query, { first: Math.min(first, 25) });

  return result.nodes.map((issue) => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    url: issue.url,
  }));
}

/**
 * Le os detalhes de uma issue especifica do Linear pelo ID ou identifier (ex: ENG-123).
 */
export async function linearGetIssue(issueId: string) {
  const linear = getClient();
  const issue = await linear.issue(issueId);

  const [state, assignee, project, team] = await Promise.all([
    issue.state,
    issue.assignee,
    issue.project,
    issue.team,
  ]);

  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? "",
    url: issue.url,
    state: state?.name,
    assignee: assignee?.name,
    project: project?.name,
    team: team?.name,
    priority: issue.priority,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
  };
}

/**
 * Lista os times disponiveis no workspace do Linear.
 */
export async function linearListTeams() {
  const linear = getClient();
  const teams = await linear.teams();
  return teams.nodes.map((t) => ({ id: t.id, name: t.name, key: t.key }));
}

/**
 * Cria uma nova issue em um time do Linear.
 * teamId pode ser o id (uuid) ou a key do time (ex: "BLI2") - resolvemos a key para id automaticamente.
 */
export async function linearCreateIssue(
  teamId: string,
  title: string,
  description?: string
) {
  const linear = getClient();

  let resolvedTeamId = teamId;
  // Se parece uma "key" curta (ex: BLI2) em vez de um uuid, resolve para o id real.
  if (!/^[0-9a-f-]{36}$/i.test(teamId)) {
    const teams = await linear.teams();
    const match = teams.nodes.find(
      (t) => t.key.toLowerCase() === teamId.toLowerCase()
    );
    if (!match) {
      throw new Error(`Time com key "${teamId}" nao encontrado no workspace.`);
    }
    resolvedTeamId = match.id;
  }

  const result = await linear.createIssue({
    teamId: resolvedTeamId,
    title,
    description,
  });

  const issue = await result.issue;

  return {
    success: result.success,
    id: issue?.id,
    identifier: issue?.identifier,
    title: issue?.title,
    url: issue?.url,
  };
}
