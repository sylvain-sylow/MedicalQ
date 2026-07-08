// lib/providers/ovhcloud-sms.adapter.ts
// Adaptateur SMS OVHcloud — implémente SmsProvider via @ovhcloud/node-ovh
// Spec § 14.3 : OVHcloud API SMS, même périmètre HDS que base et stockage
//
// Variables d'env requises (voir .env.example) :
//   OVH_SMS_ENDPOINT      — "ovh-eu" (défaut)
//   OVH_SMS_APP_KEY       — Application Key (créer sur https://eu.api.ovh.com/createApp/)
//   OVH_SMS_APP_SECRET    — Application Secret
//   OVH_SMS_CONSUMER_KEY  — Consumer Key (autoriser POST /sms/*/jobs)
//   OVH_SMS_SERVICE_NAME  — Nom du service SMS (ex. "sms-xxxxxxx-1")
//   OVH_SMS_SENDER        — Expéditeur (alphanumérique ≤ 11 chars, ou numéro)
//
// Scope minimal du Consumer Key : POST /sms/*/jobs

import ovh from "@ovhcloud/node-ovh";
import type { SmsProvider, SmsMessage, SmsSendResult } from "./sms.provider";

interface OvhSmsJobResponse {
  ids: number[];
  invalidReceivers?: string[];
  validReceivers?: string[];
  totalCreditsRemoved?: number;
}

export class OvhcloudSmsAdapter implements SmsProvider {
  private readonly client: ReturnType<typeof ovh>;
  private readonly serviceName: string;
  private readonly sender: string;

  constructor() {
    const endpoint    = process.env.OVH_SMS_ENDPOINT    ?? "ovh-eu";
    const appKey      = process.env.OVH_SMS_APP_KEY      ?? "";
    const appSecret   = process.env.OVH_SMS_APP_SECRET   ?? "";
    const consumerKey = process.env.OVH_SMS_CONSUMER_KEY ?? "";

    this.serviceName = process.env.OVH_SMS_SERVICE_NAME ?? "";
    this.sender      = process.env.OVH_SMS_SENDER       ?? "Sylow";

    this.client = ovh({ endpoint, appKey, appSecret, consumerKey });
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    if (!this.serviceName) {
      console.error("[OvhcloudSmsAdapter] OVH_SMS_SERVICE_NAME manquant");
      return { success: false, error: "OVHcloud SMS: OVH_SMS_SERVICE_NAME non configuré" };
    }

    try {
      const result = await this.client.requestPromised(
        "POST",
        `/sms/${this.serviceName}/jobs`,
        {
          message:          message.body,
          receivers:        [message.to],
          sender:           this.sender,
          senderForResponse: false,
          noStopClause:     false,
          // charset UTF-8 par défaut — couverture des accents français
          charset:          "UTF-8" as const,
        }
      ) as OvhSmsJobResponse;

      if (result.invalidReceivers && result.invalidReceivers.length > 0) {
        return {
          success: false,
          error: `Numéro invalide selon OVHcloud: ${result.invalidReceivers.join(", ")}`,
        };
      }

      const messageId = result.ids?.[0]?.toString();
      return { success: true, messageId };
    } catch (err: unknown) {
      const errObj = err as { error?: number; message?: string };
      const detail = errObj.message ?? String(err);
      console.error(`[OvhcloudSmsAdapter] Erreur API OVH (${errObj.error ?? "?"}) :`, detail);
      return {
        success: false,
        error: `OVHcloud SMS error ${errObj.error ?? ""}: ${detail}`,
      };
    }
  }
}
