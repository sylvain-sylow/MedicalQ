// app/api/auth/otp/send/route.ts
// Endpoint : POST /api/auth/otp/send
// Envoie un OTP SMS au numéro fourni

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/otp";
import { MockSmsAdapter } from "@/lib/providers/mock-sms.adapter";
import { OvhcloudSmsAdapter } from "@/lib/providers/ovhcloud-sms.adapter";

const bodySchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Numéro de téléphone invalide (format E.164 requis)"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;

    // Fournisseur SMS : mock en dev, OVHcloud en production
    const smsProvider =
      process.env.NODE_ENV === "production"
        ? new OvhcloudSmsAdapter()
        : new MockSmsAdapter();

    const result = await sendOtp(phone, smsProvider);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/otp/send]", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
