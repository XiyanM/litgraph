import Papa from "papaparse";

export interface ParsedBookRow {
  title: string;
  author: string;
}

// Goodreads' export columns are stable and well-documented — these are
// the exact header names, no aliasing needed.
function getField(row: Record<string, string>, key: string): string {
  return row[key]?.trim() ?? "";
}

export function parseLibraryCsv(file: File): Promise<ParsedBookRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
          .map((row) => ({
            title: getField(row, "Title"),
            author: getField(row, "Author"),
            shelf: getField(row, "Exclusive Shelf").toLowerCase(),
          }))
          .filter((row) => row.title && row.author)
          .filter((row) => !row.shelf || row.shelf === "read");

        resolve(rows.map(({ title, author }) => ({ title, author })));
      },
      error: reject,
    });
  });
}
