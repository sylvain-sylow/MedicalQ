// lib/services/clamav.ts
// Service d'analyse antivirus ClamAV pour les documents de santé

export type ScanStatus = "CLEAN" | "INFECTED" | "ERROR";

/**
 * Simule ou appelle ClamAV pour analyser un fichier téléversé.
 * Recherche la signature de test standard EICAR ou un marqueur de fichier infecté dans le nom.
 */
export async function scanFile(fileName: string, fileContentStr?: string): Promise<ScanStatus> {
  // Simuler le délai de latence de ClamAV (ex. 1 seconde)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const nameLower = fileName.toLowerCase();
  if (nameLower.includes("infected") || nameLower.includes("virus") || nameLower.includes("eicar")) {
    return "INFECTED";
  }

  if (fileContentStr) {
    // Signature standard EICAR de test antivirus
    const eicarSignature = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!";
    if (fileContentStr.includes(eicarSignature)) {
      return "INFECTED";
    }
  }

  return "CLEAN";
}
