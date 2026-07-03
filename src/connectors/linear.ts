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
