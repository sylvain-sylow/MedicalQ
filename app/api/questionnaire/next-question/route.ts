// app/api/questionnaire/next-question/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAssuredSession } from "@/lib/auth/session";
import { getNextQuestion } from "@/lib/decision-tree/engine";
import { prisma } from "@/lib/db/prisma";

const bodySchema = z.object({ fileId: z.string().cuid() });

export async function POST(request: NextRequest) {
  const session = await getAssuredSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "fileId requis" }, { status: 400 });

  const { fileId } = parsed.data;

  // Charger les réponses existantes
  const answers = await prisma.answer.findMany({ where: { fileId }, orderBy: { revision: "desc" } });
  const answerMap: Record<string, unknown> = {};
  for (const a of answers) {
    if (!(a.questionId in answerMap)) answerMap[a.questionId] = a.value;
  }

  const result = getNextQuestion(answerMap);

  if (!result) return NextResponse.json({ done: true });

  // Ne jamais renvoyer l'arbre entier — uniquement la question courante
  return NextResponse.json({
    question: {
      id:            result.question.id,
      text:          result.question.text,
      hint:          result.question.hint,
      type:          result.question.type,
      options:       result.question.options,
      slider:        result.question.slider,
      textSensitive: result.question.textSensitive ?? false,
      allowUpload:   result.question.allowUpload ?? false,
    },
    progress: result.progress,
  });
}
