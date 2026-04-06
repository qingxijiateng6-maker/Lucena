import { ListeningReviewClient } from "@/components/review/listening-review-client";

export default async function ListeningReviewPage({
  params,
}: {
  params: Promise<{ sessionNumber: string }>;
}) {
  const { sessionNumber } = await params;
  return <ListeningReviewClient sessionNumber={Number(sessionNumber)} />;
}
