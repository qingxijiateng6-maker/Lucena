import { ReadingStudyClient } from "@/components/reading/reading-study-client";

export default async function ReadingStudyPage({
  params,
}: {
  params: Promise<{ sessionNumber: string }>;
}) {
  const { sessionNumber } = await params;
  return <ReadingStudyClient sessionNumber={Number(sessionNumber)} />;
}
