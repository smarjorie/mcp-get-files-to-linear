import { google } from "googleapis";

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY nao configuradas. Crie uma Service Account no Google Cloud Console, ative as APIs Docs e Drive, e compartilhe os documentos com o e-mail da service account."
    );
  }

  // Na Vercel, quebras de linha da chave privada precisam ser escapadas como \n
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/documents.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });
}

/**
 * Busca documentos do Google Drive por nome/texto (limitado a arquivos
 * compartilhados com a service account).
 */
export async function gdocsSearch(query: string, pageSize = 10) {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });

  const escaped = query.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.document' and fullText contains '${escaped}' and trashed = false`,
    pageSize: Math.min(pageSize, 25),
    fields: "files(id, name, modifiedTime, webViewLink)",
  });

  return (res.data.files ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    modifiedTime: f.modifiedTime,
    url: f.webViewLink,
  }));
}

/**
 * Le o conteudo de um Google Doc e devolve como texto plano.
 */
export async function gdocsGetDocument(documentId: string) {
  const auth = getAuth();
  const docs = google.docs({ version: "v1", auth });

  const res = await docs.documents.get({ documentId });
  const doc = res.data;

  const textParts: string[] = [];
  for (const element of doc.body?.content ?? []) {
    if (element.paragraph?.elements) {
      const line = element.paragraph.elements
        .map((el) => el.textRun?.content ?? "")
        .join("");
      if (line.trim()) textParts.push(line.trimEnd());
    } else if (element.table) {
      for (const row of element.table.tableRows ?? []) {
        const cells = (row.tableCells ?? []).map((cell) =>
          (cell.content ?? [])
            .map((c) =>
              (c.paragraph?.elements ?? [])
                .map((el) => el.textRun?.content ?? "")
                .join("")
                .trim()
            )
            .join(" ")
        );
        textParts.push(cells.join(" | "));
      }
    }
  }

  return {
    id: documentId,
    title: doc.title,
    content: textParts.join("\n"),
  };
}
