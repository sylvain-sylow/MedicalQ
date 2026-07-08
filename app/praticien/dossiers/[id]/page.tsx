// app/praticien/dossiers/[id]/page.tsx
// Détail d'un dossier praticien — réponses, documents, scoring ★
// TODO J6

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PraticienDossierDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <main>
      <h1>Dossier {id}</h1>
      {/* TODO J6 : bandeau synthèse, rubriques dépliables, scoring ★, documents */}
    </main>
  );
}
