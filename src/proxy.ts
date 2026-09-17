import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";

export async function proxy(request: Request) {
  if (!auth0) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Authentication is not configured", { status: 503 });
    }
    return NextResponse.next();
  }

  const response = await auth0.middleware(request);
  const url = new URL(request.url);
  if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/")) return response;

  const session = await auth0.getSession(request as NextRequest);
  if (session) return response;

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("returnTo", `${url.pathname}${url.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
