import { Client } from "@notionhq/client";

function getClient(): Client {
  const token = process.env.NOTION_API_KEY;
  if (!token) {
    throw new Error(
      "NOTION_API_KEY nao configurada. Crie uma integracao em https://www.notion.so/my-integrations e compartilhe as paginas/databases com ela."
    );
  }
  return new Client({ auth: token });
}

/**
 * Busca paginas e databases no Notion por texto livre.
 */
export async function notionSearch(query: string, pageSize = 10) {
  const notion = getClient();
  const response = await notion.search({
    query,
    page_size: Math.min(pageSize, 25),
    sort: { direction: "descending", timestamp: "last_edited_time" },
  });

  return response.results.map((item: any) => {
    const isPage = item.object === "page";
    const title = extractTitle(item);
    return {
      id: item.id,
      object: item.object,
      title,
      url: item.url,
      last_edited_time: item.last_edited_time,
      type: isPage ? "page" : "database",
    };
  });
}

/**
 * Le o conteudo (blocos) de uma pagina do Notion e devolve como texto plano.
 */
export async function notionGetPage(pageId: string, maxBlocks = 200) {
  const notion = getClient();

  const page = await notion.pages.retrieve({ page_id: pageId });
  const title = extractTitle(page);

  let cursor: string | undefined = undefined;
  const textParts: string[] = [];
  let fetched = 0;

  do {
    const blocks: any = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of blocks.results) {
      const text = blockToText(block);
      if (text) textParts.push(text);
      fetched++;
      if (fetched >= maxBlocks) break;
    }

    cursor = blocks.has_more && fetched < maxBlocks ? blocks.next_cursor ?? undefined : undefined;
  } while (cursor);

  return {
    id: pageId,
    title,
    url: (page as any).url,
    content: textParts.join("\n"),
  };
}

function extractTitle(item: any): string {
  try {
    if (item.properties) {
      for (const key of Object.keys(item.properties)) {
        const prop = item.properties[key];
        if (prop?.type === "title" && Array.isArray(prop.title)) {
          return prop.title.map((t: any) => t.plain_text).join("") || "(sem titulo)";
        }
      }
    }
    if (item.title && Array.isArray(item.title)) {
      return item.title.map((t: any) => t.plain_text).join("") || "(sem titulo)";
    }
  } catch {
    // ignore
  }
  return "(sem titulo)";
}

function blockToText(block: any): string {
  const type = block.type;
  const value = block[type];
  if (!value || !Array.isArray(value.rich_text)) return "";
  const text = value.rich_text.map((t: any) => t.plain_text).join("");
  if (!text) return "";

  switch (type) {
    case "heading_1":
      return `# ${text}`;
    case "heading_2":
      return `## ${text}`;
    case "heading_3":
      return `### ${text}`;
    case "bulleted_list_item":
      return `- ${text}`;
    case "numbered_list_item":
      return `1. ${text}`;
    case "to_do":
      return `[${value.checked ? "x" : " "}] ${text}`;
    case "quote":
      return `> ${text}`;
    case "code":
      return `\`\`\`\n${text}\n\`\`\``;
    default:
      return text;
  }
}
