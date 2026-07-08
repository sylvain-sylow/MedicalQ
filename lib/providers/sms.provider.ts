// lib/providers/sms.provider.ts
// Interface SmsProvider — isoler tout fournisseur SMS derrière ce contrat
// Le changement de fournisseur ne touche qu'un adaptateur, jamais la logique métier

export interface SmsMessage {
  to: string;    // numéro E.164 — ex. "+33612345678" ou "+35212345678"
  body: string;  // corps du SMS (≤ 160 caractères recommandé pour éviter les découpages)
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Interface abstraite — tous les adaptateurs SMS l'implémentent.
 * Fournisseur actuel : OVHcloud API SMS (lib/providers/ovhcloud-sms.adapter.ts)
 * Fournisseur dev/test : MockSmsProvider (lib/providers/mock-sms.adapter.ts)
 */
export interface SmsProvider {
  send(message: SmsMessage): Promise<SmsSendResult>;
}
