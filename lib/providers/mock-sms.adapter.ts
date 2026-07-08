// lib/providers/mock-sms.adapter.ts
// Adaptateur SMS mocké — utilisé en développement et dans les tests
// Les OTP sont affichés dans la console au lieu d'être envoyés par SMS

import type { SmsProvider, SmsMessage, SmsSendResult } from "./sms.provider";

export class MockSmsAdapter implements SmsProvider {
  private readonly sentMessages: Array<{ to: string; body: string; at: Date }> = [];

  async send(message: SmsMessage): Promise<SmsSendResult> {
    const entry = { to: message.to, body: message.body, at: new Date() };
    this.sentMessages.push(entry);

    // Affichage console en développement — pratique pour les tests manuels
    console.log("\n┌─────────────────────────────────────────┐");
    console.log("│  📱 SMS MOCKÉ (dev/test)                │");
    console.log(`│  Vers   : ${message.to.padEnd(29)} │`);
    console.log(`│  Corps  : ${message.body.substring(0, 29).padEnd(29)} │`);
    console.log("└─────────────────────────────────────────┘\n");

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  /** Utilitaire pour les tests — récupère les messages envoyés */
  getSentMessages() {
    return [...this.sentMessages];
  }

  /** Utilitaire pour les tests — efface les messages */
  clearMessages() {
    this.sentMessages.length = 0;
  }
}
