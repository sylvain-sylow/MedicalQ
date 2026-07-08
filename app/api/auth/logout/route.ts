// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await destroySession();
  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  return NextResponse.redirect(url, 303);
}
