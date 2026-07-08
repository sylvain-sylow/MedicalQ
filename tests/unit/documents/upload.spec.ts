// tests/unit/documents/upload.spec.ts
import { describe, it, expect } from "vitest";
import { scanFile } from "@/lib/services/clamav";

describe("Scan Antivirus ClamAV & EICAR", () => {
  it("détecte la signature EICAR standard dans le contenu du fichier", async () => {
    const eicarContent = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
    const res = await scanFile("declaration.pdf", eicarContent);
    expect(res).toBe("INFECTED");
  });

  it("détecte un fichier infecté d'après son nom", async () => {
    const res = await scanFile("virus_infected_file.png", "fake content");
    expect(res).toBe("INFECTED");
  });

  it("déclare sain un fichier standard", async () => {
    const res = await scanFile("ordonnance.pdf", "Contenu sain d'ordonnance médicale.");
    expect(res).toBe("CLEAN");
  });
});
