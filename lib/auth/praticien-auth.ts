// lib/auth/praticien-auth.ts
// Authentification praticien en 2 étapes :
//   Step 1 — email + mot de passe → tempToken JWT (5 min)
//   Step 2 — tempToken + code TOTP → session finale JWT httpOnly
// Spec § 9 : "praticien avec 2FA TOTP obligatoire"

import { SignJWT, jwtVerify } from "jose";
import { generateSecret, generateURI, verify as verifyOtp } from "otplib";

const JWT_SECRET = new TextEncoder().encode(
  // `||` (et non `??`) : une variable définie mais VIDE (`JWT_SECRET=`) doit aussi
  // retomber sur le secret de dev, sinon jose lève « Zero-length key is not supported ».
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars!!"
);

// Durée du token temporaire (entre step 1 et step 2)
const TEMP_TOKEN_MAX_AGE = 5 * 60; // 5 minutes

export interface TempTokenPayload {
  praticienId: string;
  step: "totp_pending";
}

/**
 * Vérifie le mot de passe haché (bcrypt ou argon2).
 * Le hash est stocké dans Praticien.passwordHash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // Utilise une comparaison en temps constant via crypto.subtle
  // En production : utiliser bcrypt ou argon2 natif
  // Pour l'instant, on suppose que hash = SHA-256 hex du mot de passe (à remplacer en J7 par argon2)
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Comparaison en temps constant via encode + compare longueurs
  if (hashHex.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hashHex.length; i++) {
    diff |= hashHex.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hache un mot de passe (pour création de compte praticien en dev/seed).
 */
export async function hashPassword(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Crée un token temporaire signé après validation du mot de passe (step 1).
 * Ce token n'est PAS une session : il indique uniquement que step 1 a réussi.
 */
export async function createTempToken(praticienId: string): Promise<string> {
  return new SignJWT({ praticienId, step: "totp_pending" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TEMP_TOKEN_MAX_AGE}s`)
    .sign(JWT_SECRET);
}

/**
 * Vérifie un token temporaire et retourne le payload.
 */
export async function verifyTempToken(token: string): Promise<TempTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.step !== "totp_pending") return null;
    return payload as unknown as TempTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Valide un code TOTP à 6 chiffres contre le secret du praticien.
 * Le secret est stocké chiffré — ici on suppose qu'il a été déchiffré avant d'appeler cette fonction.
 */
export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  // Tolérance ±1 étape (30 s) pour compenser les dérives d'horloge (otplib v13 : epochTolerance en secondes)
  const result = await verifyOtp({ token: code, secret, epochTolerance: 30 });
  return result.valid;
}

/**
 * Génère un nouveau secret TOTP pour un praticien (enrollment).
 * Retourne le secret et l'URI otpauth:// pour le QR code.
 */
export function generateTotpSecret(email: string): { secret: string; uri: string } {
  const secret = generateSecret();
  const uri = generateURI({ issuer: "Sylow Medical", label: email, secret });
  return { secret, uri };
}
