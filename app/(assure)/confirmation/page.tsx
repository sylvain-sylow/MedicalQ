// app/(assure)/confirmation/page.tsx
// Page de confirmation — signature + récapitulatif (SANS scoring, jamais)
// TODO J5

export default function ConfirmationPage() {
  return (
    <main>
      <h1>Votre déclaration est complète</h1>
      {/* TODO J5 : récap, signature électronique, pièces manquantes */}
      {/* RÈGLE : aucun champ score/stars/etoile ici — testé par le test anti-fuite Playwright */}
    </main>
  );
}
