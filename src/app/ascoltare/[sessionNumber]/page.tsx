import { ListeningStudyClient } from "@/components/listening/listening-study-client";

export default async function ListeningStudyPage({
  params,
}: {
  params: Promise<{ sessionNumber: string }>;
}) {
  const { sessionNumber } = await params;
  return <ListeningStudyClient sessionNumber={Number(sessionNumber)} />;
}
