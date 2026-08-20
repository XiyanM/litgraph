import { NextRequest } from "next/server";

const COOKIE_NAME = "litgraph_library_id";

export function getLibraryId(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}
