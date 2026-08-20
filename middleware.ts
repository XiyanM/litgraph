import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "litgraph_library_id";

export function middleware(request: NextRequest) {
  if (request.cookies.get(COOKIE_NAME)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(COOKIE_NAME, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: "/:path*",
};
