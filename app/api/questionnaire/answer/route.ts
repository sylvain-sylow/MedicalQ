// app/api/questionnaire/answer/route.ts
// Endpoint : POST /api/questionnaire/answer
// Autosave d'une réponse — chiffrée au niveau champ (AES-256-GCM en J7)
// TODO J2

import { NextRequest, NextResponse } from "next/server";
import { getAssuredSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getAssuredSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // TODO J2 : valider questionId + value, sauvegarder Answer, recalculer next
  return NextResponse.json({ stub: true, message: "TODO J2 — autosave réponse" }, { status: 501 });
}
