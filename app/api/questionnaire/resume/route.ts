// app/api/questionnaire/resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAssuredSession } from "@/lib/auth/session";
import { getNextQuestion } from "@/lib/decision-tree/engine";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await getAssuredSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId requis" }, { status: 400 });

  const file = await prisma.healthFile.findFirst({
    where: { id: fileId, insuredId: session.insuredId },
  });
  if (!file) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const answers = await prisma.answer.findMany({ where: { fileId }, orderBy: { revision: "desc" } });
  const answerMap: Record<string, unknown> = {};
  for (const a of answers) {
    if (!(a.questionId in answerMap)) answerMap[a.questionId] = a.value;
  }

  const result = getNextQuestion(answerMap);
  
  // Récupérer les documents déjà joints au dossier
  const fileDocuments = await prisma.document.findMany({
    where: { fileId },
    select: {
      id: true,
      fileName: true,
      questionId: true,
      virusScan: true,
    },
  });

  if (!result) {
    return NextResponse.json({
      done: true,
      answers: answerMap,
      documents: fileDocuments,
      status: file.status,
      signedAt: file.signedAt,
      validUntil: file.validUntil,
    });
  }

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
    answeredCount: Object.keys(answerMap).length,
    answers: answerMap,
    documents: fileDocuments,
    status: file.status,
    signedAt: file.signedAt,
    validUntil: file.validUntil,
  });
}
