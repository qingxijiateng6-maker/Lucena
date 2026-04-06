import { ReadingReviewClient } from "@/components/review/reading-review-client";

export default async function ReadingReviewPage({
  params,
}: {
  params: Promise<{ sessionNumber: string }>;
}) {
  const { sessionNumber } = await params;
  return <ReadingReviewClient sessionNumber={Number(sessionNumber)} />;
}
