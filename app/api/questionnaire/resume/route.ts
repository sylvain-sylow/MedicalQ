// app/api/questionnaire/resume/route.ts
// Endpoint : GET /api/questionnaire/resume
// Reprend une session à là où l'assuré s'était arrêté
// TODO J2

import { NextRequest, NextResponse } from "next/server";
import { getAssuredSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getAssuredSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // TODO J2 : charger les Answer du fileId courant et retourner la prochaine question
  return NextResponse.json({ stub: true, message: "TODO J2 — reprise de session" }, { status: 501 });
}
