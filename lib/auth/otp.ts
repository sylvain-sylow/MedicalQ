// lib/auth/otp.ts
// Logique OTP : génération, envoi, vérification
// Rate limiting : 3 tentatives max, validité 5 min (spec Phase 1 § 2)

import { randomInt } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { SmsProvider } from "@/lib/providers/sms.provider";

const OTP_DIGITS = 6;
const OTP_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;

/** Génère un code OTP à 6 chiffres */
function generateOtpCode(): string {
  return randomInt(0, 999999).toString().padStart(OTP_DIGITS, "0");
}

/**
 * Envoie un OTP par SMS au numéro donné.
 * Invalide les OTP précédents pour ce numéro.
 */
export async function sendOtp(
  phone: string,
  smsProvider: SmsProvider
): Promise<{ success: boolean; error?: string }> {
  // Nettoyer les OTP expirés pour ce numéro
  await prisma.otpSession.deleteMany({
    where: {
      phone,
      expiresAt: { lt: new Date() },
    },
  });

  // Vérifier le rate limiting : max 3 OTP non expirés en attente
  const pending = await prisma.otpSession.count({
    where: {
      phone,
      expiresAt: { gte: new Date() },
    },
  });

  if (pending >= OTP_MAX_ATTEMPTS) {
    return {
      success: false,
      error: "Trop de demandes. Attendez 5 minutes avant de réessayer.",
    };
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_VALIDITY_MS);

  // Stocker le code hashé (TODO J7 : bcrypt — pour l'instant hash simple sha256)
  const { createHash } = await import("crypto");
  const hashedCode = createHash("sha256").update(code).digest("hex");

  await prisma.otpSession.create({
    data: { phone, code: hashedCode, expiresAt },
  });

  const result = await smsProvider.send({
    to: phone,
    body: `Votre code Sylow : ${code} (valable 5 minutes)`,
  });

  return result;
}

/**
 * Vérifie un OTP saisi par l'utilisateur.
 * Retourne true si valide, false sinon. Invalide l'OTP après utilisation.
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const { createHash } = await import("crypto");
  const hashedCode = createHash("sha256").update(code).digest("hex");

  const session = await prisma.otpSession.findFirst({
    where: {
      phone,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!session) {
    return { valid: false, error: "Code expiré ou inexistant. Demandez un nouveau code." };
  }

  // Incrémenter les tentatives
  await prisma.otpSession.update({
    where: { id: session.id },
    data: { attempts: { increment: 1 } },
  });

  if (session.attempts + 1 >= OTP_MAX_ATTEMPTS) {
    // Invalider après trop de tentatives
    await prisma.otpSession.delete({ where: { id: session.id } });
    return { valid: false, error: "Trop de tentatives. Demandez un nouveau code." };
  }

  if (session.code !== hashedCode) {
    return { valid: false, error: "Code incorrect." };
  }

  // OTP valide — supprimer pour ne pas permettre la réutilisation
  await prisma.otpSession.delete({ where: { id: session.id } });

  return { valid: true };
}
