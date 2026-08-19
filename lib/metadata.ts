// lib/metadata.ts
type BookMetadata = {
  description: string | null;
  subjects: string[];
  coverUrl: string | null;
};

export async function resolveBookMetadata(
  title: string,
  author: string,
  workKey?: string | null // Google Books volume ID, when picked from typeahead
): Promise<BookMetadata> {
  const empty: BookMetadata = {
    description: null,
    subjects: [],
    coverUrl: null,
  };

  try {
    let item: any = null;

    if (workKey) {
      // Exact volume the user picked — fetch it directly, no guessing involved.
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${workKey}?key=${process.env.GOOGLE_BOOKS_API_KEY}`
      );
      if (res.ok) item = await res.json();
    } else {
      // Fallback for manual submits with no typeahead pick — best-effort search.
      const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(
        title
      )}+inauthor:${encodeURIComponent(
        author
      )}&langRestrict=en&maxResults=1&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        item = data.items?.[0] ?? null;
      }
    }

    if (!item?.volumeInfo) return empty;

    const info = item.volumeInfo;
    const thumb = info.imageLinks?.thumbnail;

    return {
      description: info.description ?? null,
      subjects: info.categories ?? [],
      coverUrl: thumb ? thumb.replace("http://", "https://") : null, // Google serves http by default
    };
  } catch {
    return empty;
  }
}
