const WIKI_API = "https://en.wikipedia.org/w/api.php";
// Replace with your actual repo URL or contact — Wikipedia asks for a real identifier here
const USER_AGENT = "Litgraph/1.0 (https://github.com/XiyanM/litgraph)";

interface WikiSection {
  index: string;
  line: string;
  toclevel: number;
  byteoffset: number;
}

interface WikipediaEnrichment {
  sectionTitle: string;
  excerpt: string;
}

async function wikiFetch(params: Record<string, string>) {
  const url = new URL(WIKI_API);
  url.search = new URLSearchParams({ format: "json", ...params }).toString();
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`);
  return res.json();
}

async function findPageTitle(
  title: string,
  author: string
): Promise<string | null> {
  const data = await wikiFetch({
    action: "query",
    list: "search",
    srsearch: `"${title}" ${author}`,
    srlimit: "1",
  });
  return data?.query?.search?.[0]?.title ?? null;
}

async function getSections(pageTitle: string): Promise<WikiSection[]> {
  const data = await wikiFetch({
    action: "parse",
    page: pageTitle,
    prop: "sections",
  });
  return data?.parse?.sections ?? [];
}

function findThemeOrPlotSection(sections: WikiSection[]): WikiSection | null {
  // Priority order: Themes is richer for concept extraction; Plot/Synopsis are the fallback
  const priority = [/theme/i, /plot/i, /synopsis/i, /summary/i];
  for (const pattern of priority) {
    const match = sections.find((s) => pattern.test(s.line));
    if (match) return match;
  }
  return null;
}

// A matched heading (e.g. "Major themes") is often just a stub before its own
// subheadings (e.g. "Title", "Wealth", "Class") — those subsections hold the
// actual content. This finds where the matched section's content block ends:
// right before the next heading at the same-or-shallower level.
function findSectionEndOffset(
  sections: WikiSection[],
  matched: WikiSection
): number | null {
  const matchedIdx = sections.findIndex((s) => s.index === matched.index);
  for (let i = matchedIdx + 1; i < sections.length; i++) {
    if (sections[i].toclevel <= matched.toclevel) {
      return sections[i].byteoffset;
    }
  }
  return null; // matched section runs to the end of the page
}

async function fetchFullWikitext(pageTitle: string): Promise<string> {
  const data = await wikiFetch({
    action: "parse",
    page: pageTitle,
    prop: "wikitext",
  });
  return data?.parse?.wikitext?.["*"] ?? "";
}

function cleanWikitext(wikitext: string): string {
  let text = wikitext;
  text = text.replace(/<ref[^>]*\/>/gi, "");
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  for (let i = 0; i < 3; i++) text = text.replace(/\{\{[^{}]*\}\}/g, ""); // strip templates, incl. simple nesting
  text = text.replace(/\[\[File:[^\]]+\]\]/gi, "");
  text = text.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g, "$1"); // [[link|display]] -> display
  text = text.replace(/\[https?:\/\/[^\s\]]+\s+([^\]]+)\]/g, "$1"); // [url text] -> text
  text = text.replace(/\[https?:\/\/[^\]]+\]/g, "");
  text = text.replace(/'''''(.*?)'''''/g, "$1");
  text = text.replace(/'''(.*?)'''/g, "$1");
  text = text.replace(/''(.*?)''/g, "$1");
  text = text.replace(/^=+\s*(.*?)\s*=+$/gm, "$1");
  text = text.replace(/<[^>]+>/g, "");
  return text
    .replace(/\n{2,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function isPlausibleMatch(pageTitle: string, bookTitle: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalize(pageTitle).includes(normalize(bookTitle).slice(0, 10));
}

export async function resolveWikipediaEnrichment(
  title: string,
  author: string
): Promise<WikipediaEnrichment | null> {
  try {
    const pageTitle = await findPageTitle(title, author);
    if (!pageTitle) return null;
    if (!isPlausibleMatch(pageTitle, title)) {
      console.warn(
        `Wikipedia match rejected: "${pageTitle}" doesn't look like "${title}"`
      );
      return null;
    }

    const [sections, fullWikitext] = await Promise.all([
      getSections(pageTitle),
      fetchFullWikitext(pageTitle),
    ]);
    const matched = findThemeOrPlotSection(sections);
    if (!matched) return null;

    const endOffset = findSectionEndOffset(sections, matched);
    const raw =
      endOffset !== null
        ? fullWikitext.slice(matched.byteoffset, endOffset)
        : fullWikitext.slice(matched.byteoffset);

    const excerpt = cleanWikitext(raw).slice(0, 4000); // cap for LLM input cost/context
    if (!excerpt) return null;

    return { sectionTitle: matched.line, excerpt };
  } catch (err) {
    console.error("Wikipedia enrichment failed:", err);
    return null; // same graceful-degradation pattern as resolveBookMetadata
  }
}
