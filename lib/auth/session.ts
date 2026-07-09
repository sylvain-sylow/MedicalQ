// lib/auth/session.ts
// Gestion des sessions JWT httpOnly pour l'assuré
// Sessions courtes : 30 min d'inactivité (spec § 9)

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  // `||` (et non `??`) : une variable définie mais VIDE doit aussi retomber sur
  // le secret de dev, sinon jose lève « Zero-length key is not supported ».
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars!!"
);

const SESSION_COOKIE = "sylow_session";
const SESSION_MAX_AGE = 30 * 60; // 30 minutes en secondes

export interface AssuredSession {
  insuredId: string;
  fileId?: string;
  role: "assure";
}

export interface PraticienSession {
  praticienId: string;
  role: "praticien";
  praticienRole: "MEDECIN_CONSEIL" | "GESTIONNAIRE" | "ADMIN";
}

export type Session = AssuredSession | PraticienSession;

/** Crée et signe un JWT, le place dans un cookie httpOnly sécurisé */
export async function createSession(payload: Session): Promise<void> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/** Vérifie et décode le JWT depuis le cookie */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** Vérifie que la session est celle d'un assuré */
export async function getAssuredSession(): Promise<AssuredSession | null> {
  const session = await getSession();
  if (!session || session.role !== "assure") return null;
  return session as AssuredSession;
}

/** Vérifie que la session est celle d'un praticien */
export async function getPraticienSession(): Promise<PraticienSession | null> {
  const session = await getSession();
  if (!session || session.role !== "praticien") return null;
  return session as PraticienSession;
}

/** Supprime la session (déconnexion) */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
