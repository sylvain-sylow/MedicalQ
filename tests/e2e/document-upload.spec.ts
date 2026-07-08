// tests/e2e/document-upload.spec.ts
import { test, expect } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

test.describe("Gestion des documents joints (J4)", () => {
  const phone = "+33699887766";
  const code = "777888";
  const fileId = "cld-test-file-id-j4";

  test("Parcours complet de connexion, upload de fichiers et récapitulatif", async ({ page }) => {
    // 1. Initialiser la base de données via notre API de test dédiée
    const setupRes = await page.request.post("/api/test/setup-db");
    expect(setupRes.ok()).toBe(true);

    // 2. Se connecter via la page de connexion
    await page.goto("/connexion");
    await page.fill('input[type="tel"]', "0699887766");
    await page.click('button[type="submit"]');

    // Saisir le code OTP de test
    const inputs = page.locator('input[type="text"]');
    const codeDigits = code.split("");
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(codeDigits[i]);
    }
    await page.click('button[type="submit"]');

    // Attendre d'arriver sur le dossier
    await page.waitForURL("**/dossier");

    // 2. Ouvrir le questionnaire
    await page.goto(`/questionnaire?fileId=${fileId}`);
    await page.waitForLoadState("networkidle");

    // Le moteur doit nous proposer la question motif d'hospitalisation
    await expect(page.locator("h2")).toContainText("Pour quel motif avez-vous été hospitalisé(e) ?");

    // Saisir un motif d'hospitalisation
    await page.fill('input[type="text"]', "Opération de l'appendicite");

    // Vérifier que la zone d'upload est visible (car q01_hospitalisation_motif a allowUpload: true)
    await expect(page.locator("text=Pièce justificative (Optionnel)")).toBeVisible();

    // 3. Test d'upload : format refusé (ex: fichier .exe)
    const badFilePath = path.join(__dirname, "test_refuse.exe");
    fs.writeFileSync(badFilePath, "fake executable content");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator("text=Déposez un document ou cliquez ici").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(badFilePath);

    // Vérifier le message d'erreur
    await expect(page.locator("text=Format de fichier non supporté")).toBeVisible();
    fs.unlinkSync(badFilePath);

    // 4. Test d'upload : taille excessive (> 15 Mo)
    const bigFilePath = path.join(__dirname, "test_trop_grand.pdf");
    const bigFileStream = fs.createWriteStream(bigFilePath);
    // Écrire 16 Mo de données
    bigFileStream.write(Buffer.alloc(16 * 1024 * 1024));
    bigFileStream.end();

    const fileChooserPromise2 = page.waitForEvent("filechooser");
    await page.locator("text=Déposez un document ou cliquez ici").click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles(bigFilePath);

    // Vérifier l'erreur de taille
    await expect(page.locator("text=Le fichier dépasse la taille maximale autorisée de 15 Mo")).toBeVisible();
    fs.unlinkSync(bigFilePath);

    // 5. Test d'upload : fichier sain valide
    const healthyFilePath = path.join(__dirname, "ordonnance.pdf");
    fs.writeFileSync(healthyFilePath, "Contenu sain d'ordonnance médicale.");

    const fileChooserPromise3 = page.waitForEvent("filechooser");
    await page.locator("text=Déposez un document ou cliquez ici").click();
    const fileChooser3 = await fileChooserPromise3;
    await fileChooser3.setFiles(healthyFilePath);

    // Attendre que le document apparaisse dans la liste
    await expect(page.locator("text=ordonnance.pdf")).toBeVisible();
    fs.unlinkSync(healthyFilePath);

    // 6. Continuer le questionnaire
    await page.click('button:has-text("Suivant")');

    // 7. Naviguer vers la page de récapitulatif
    await page.goto(`/dossier/recap?fileId=${fileId}`);
    await page.waitForLoadState("networkidle");

    // Vérifier que le document s'affiche dans les documents joints
    await expect(page.locator("text=ordonnance.pdf")).toBeVisible();
    
    // Le statut de scan doit être affiché (Sain)
    await expect(page.locator("text=Sain")).toBeVisible();

    // Cliquer sur certifier et signer
    await page.click('button:has-text("Certifier et signer le dossier")');

    // Vérifier le succès de la signature
    await expect(page.locator("text=Dossier signé avec succès !")).toBeVisible();
  });
});
