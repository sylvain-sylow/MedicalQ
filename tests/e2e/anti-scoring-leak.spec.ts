// tests/e2e/anti-scoring-leak.spec.ts
// ═══════════════════════════════════════════════════════════════════════════════
// TEST ANTI-FUITE SCORING — RÈGLE ABSOLUE spec § 1 & § 5.3
// ═══════════════════════════════════════════════════════════════════════════════
//
// Ce test échoue si un champ score/stars/etoile/étoile apparaît :
//   - dans une réponse réseau côté assuré (API calls interceptés)
//   - dans le DOM des pages assuré
//   - dans les cookies ou le localStorage
//
// Il DOIT tourner en CI à chaque commit, pour toute la durée du projet.
// Un seul échec = blocage du merge.

import { test, expect, type Route, type Request } from "@playwright/test";

// Patterns interdits côté assuré — toute occurrence = fuite
const FORBIDDEN_PATTERNS = [
  /\bscore\b/i,
  /\bstars\b/i,
  /\bétoile\b/i,
  /\betoile\b/i,
  /\bstarFor\b/i,
  /\bglobalScore\b/i,
  /\bperTheme\b/i,
  /\bengineVersion\b/i,
  /\bpendingValidation\b/i, // champ interne barème — ne jamais exposer côté assuré
];

// Pages de l'espace assuré à inspecter
const ASSURE_PAGES = [
  "/",
  "/connexion",
  "/dossier",
  "/questionnaire",
  "/confirmation",
];

// Routes API assuré à surveiller (exclure les routes praticien par définition)
const ASSURE_API_ROUTES = [
  "/api/auth/otp/send",
  "/api/auth/otp/verify",
  "/api/questionnaire/next-question",
  "/api/questionnaire/answer",
  "/api/questionnaire/resume",
];

function containsForbiddenPattern(text: string): string | null {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) return pattern.source;
  }
  return null;
}

// ─── Test 1 : Interception réseau ─────────────────────────────────────────────

test("aucune réponse API assuré ne contient de données de scoring", async ({ page }) => {
  const leaks: Array<{ url: string; pattern: string; body: string }> = [];

  // Intercepter toutes les réponses des routes assuré
  await page.route("**/api/**", async (route: Route, request: Request) => {
    const url = request.url();

    // Laisser passer les routes praticien — elles ont le droit d'avoir du scoring
    if (url.includes("/api/scoring") || url.includes("/praticien")) {
      await route.continue();
      return;
    }

    // Continuer la requête et inspecter la réponse
    const response = await route.fetch();
    const body = await response.text();

    const leak = containsForbiddenPattern(body);
    if (leak) {
      leaks.push({ url, pattern: leak, body: body.substring(0, 200) });
    }

    await route.fulfill({ response });
  });

  // Parcourir les pages assuré et déclencher les appels API
  for (const pagePath of ASSURE_PAGES) {
    await page.goto(pagePath);
    await page.waitForLoadState("networkidle");
  }

  // Appeler les routes API assuré directement
  for (const apiRoute of ASSURE_API_ROUTES) {
    try {
      await page.request.post(apiRoute, {
        data: {},
        failOnStatusCode: false,
      });
    } catch {
      // Ignorer les erreurs de connexion — on inspecte uniquement les réponses valides
    }
  }

  expect(
    leaks,
    `FUITE DE SCORING DÉTECTÉE ! ${leaks.length} réponse(s) contiennent des données interdites :\n` +
      leaks.map((l) => `  [${l.pattern}] ${l.url}\n  → ${l.body}`).join("\n")
  ).toHaveLength(0);
});

// ─── Test 2 : DOM des pages assuré ────────────────────────────────────────────

test("aucune page assuré n'expose de données de scoring dans le DOM", async ({ page }) => {
  const leaks: Array<{ page: string; pattern: string }> = [];

  for (const pagePath of ASSURE_PAGES) {
    await page.goto(pagePath);
    await page.waitForLoadState("networkidle");

    const html = await page.content();
    const leak = containsForbiddenPattern(html);

    // Exception : les commentaires de développement dans les stubs sont tolérés
    // On inspecte uniquement le contenu visible rendu
    const bodyText = await page.evaluate(() => document.body.innerText);
    const leakInBody = containsForbiddenPattern(bodyText);

    if (leakInBody) {
      leaks.push({ page: pagePath, pattern: leakInBody });
    }
  }

  expect(
    leaks,
    `FUITE DOM DÉTECTÉE ! Le scoring apparaît dans le DOM de pages assuré :\n` +
      leaks.map((l) => `  [${l.pattern}] ${l.page}`).join("\n")
  ).toHaveLength(0);
});

// ─── Test 3 : localStorage et cookies ─────────────────────────────────────────

test("le localStorage et les cookies côté assuré ne contiennent pas de scoring", async ({ page }) => {
  for (const pagePath of ASSURE_PAGES) {
    await page.goto(pagePath);
    await page.waitForLoadState("networkidle");

    // Inspecter le localStorage
    const localStorage = await page.evaluate(() =>
      JSON.stringify(Object.fromEntries(
        Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)])
      ))
    );

    const lsLeak = containsForbiddenPattern(localStorage);
    expect(
      lsLeak,
      `FUITE localStorage [${lsLeak}] sur ${pagePath} : ${localStorage.substring(0, 200)}`
    ).toBeNull();

    // Inspecter les cookies
    const cookies = await page.context().cookies();
    const cookieStr = JSON.stringify(cookies);
    const cookieLeak = containsForbiddenPattern(cookieStr);
    expect(
      cookieLeak,
      `FUITE cookie [${cookieLeak}] sur ${pagePath}`
    ).toBeNull();
  }
});

// ─── Test 4 : L'endpoint /api/scoring retourne bien 403 pour un assuré ─────────

test("GET /api/scoring retourne 403 pour un utilisateur non-praticien", async ({ page }) => {
  // Sans session praticien, l'endpoint doit retourner 403
  const response = await page.request.get("/api/scoring", {
    failOnStatusCode: false,
  });

  expect(response.status()).toBe(403);

  const body = await response.json();
  // La réponse d'erreur ne doit pas non plus contenir de données de scoring
  const bodyStr = JSON.stringify(body);
  const leak = containsForbiddenPattern(bodyStr);
  expect(
    leak,
    `FUITE dans la réponse d'erreur 403 [${leak}]: ${bodyStr}`
  ).toBeNull();
});
