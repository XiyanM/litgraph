// lib/metadata.ts
type BookMetadata = {
  description: string | null;
  subjects: string[];
  coverUrl: string | null;
};

export async function resolveBookMetadata(
  title: string,
  author: string
): Promise<BookMetadata> {
  const empty: BookMetadata = {
    description: null,
    subjects: [],
    coverUrl: null,
  };

  try {
    const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(
      title
    )}&author=${encodeURIComponent(author)}&fields=key,cover_i,subject&limit=1`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return empty;

    const searchData = await searchRes.json();
    const doc = searchData.docs?.[0];
    if (!doc) return empty;

    const coverUrl = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null;

    const subjects: string[] = doc.subject?.slice(0, 8) ?? [];

    let description: string | null = null;
    const workKey = doc.key; // e.g. "/works/OL45804W"
    if (workKey) {
      const workRes = await fetch(`https://openlibrary.org${workKey}.json`);
      if (workRes.ok) {
        const workData = await workRes.json();
        description =
          typeof workData.description === "string"
            ? workData.description
            : workData.description?.value ?? null;
      }
    }

    return { description, subjects, coverUrl };
  } catch {
    return empty;
  }
}
