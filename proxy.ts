import { NextResponse, type NextRequest } from "next/server";

function encodeBasicAuth(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function proxy(req: NextRequest) {
  if (process.env.DASHBOARD_AUTH_DISABLED === "true") {
    return NextResponse.next();
  }

  const username = process.env.DASHBOARD_USERNAME;
  const password = process.env.DASHBOARD_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Dashboard auth is not configured", { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const expected = `Basic ${encodeBasicAuth(`${username}:${password}`)}`;

  if (authHeader !== expected) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="White Law Dashboard"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
