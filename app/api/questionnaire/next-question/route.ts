// app/api/questionnaire/next-question/route.ts
// Endpoint : POST /api/questionnaire/next-question
// Retourne la prochaine question d'après l'état courant
// RÈGLE : ne renvoie JAMAIS l'arbre complet, uniquement la prochaine question
// TODO J2 : implémenter avec lib/decision-tree/engine.ts

import { NextRequest, NextResponse } from "next/server";
import { getAssuredSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getAssuredSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // TODO J2 : const question = await getNextQuestion(session.fileId, answers);
  return NextResponse.json({ stub: true, message: "TODO J2 — moteur d'arbre" }, { status: 501 });
}
