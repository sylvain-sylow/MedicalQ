// app/praticien/dossiers/[id]/examens/page.tsx
// Demandes d'examens complémentaires
// TODO J6

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PraticienExamensPage({ params }: Props) {
  const { id } = await params;
  return (
    <main>
      <h1>Examens — dossier {id}</h1>
      {/* TODO J6 : référentiel Annexe B, formulaire demande, suivi statut */}
    </main>
  );
}
