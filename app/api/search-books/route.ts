import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) return NextResponse.json([]);

  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:%22${encodeURIComponent(
      q
    )}%22&langRestrict=en&maxResults=5&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(
        "Google Books search failed:",
        res.status,
        await res.text()
      );
      return NextResponse.json([]);
    }

    const data = await res.json();
    const seen = new Set<string>();
    const suggestions = (data.items ?? [])
      .filter(
        (item: any) =>
          item.volumeInfo?.title && item.volumeInfo?.authors?.length
      )
      .filter((item: any) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .map((item: any) => {
        const thumb = item.volumeInfo.imageLinks?.thumbnail;
        return {
          title: item.volumeInfo.title,
          author: item.volumeInfo.authors[0],
          workKey: item.id,
          coverUrl: thumb ? thumb.replace("http://", "https://") : null,
        };
      });
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}
