// app/api/scoring/route.ts
// Endpoint : RÉSERVÉ PRATICIEN — jamais appelé côté assuré
// RÈGLE ABSOLUE : vérification du rôle serveur-side obligatoire
// Le test Playwright anti-fuite s'assure que cet endpoint n'est PAS accessible côté assuré

import { NextRequest, NextResponse } from "next/server";
import { getPraticienSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getPraticienSession();
  if (!session) {
    // Retourner 403 (et non 401) pour ne pas révéler l'existence de l'endpoint
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // TODO J5 : retourner le scoring du dossier demandé
  return NextResponse.json({ stub: true, message: "TODO J5 — scoring praticien" }, { status: 501 });
}
