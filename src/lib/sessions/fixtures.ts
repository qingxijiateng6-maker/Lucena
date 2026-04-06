import readingCatalog from "@/data/seed/reading-0001/catalog.json";
import readingLearning from "@/data/seed/reading-0001/learning.json";
import readingReview from "@/data/seed/reading-0001/review.json";
import listeningCatalog from "@/data/seed/listening-0001/catalog.json";
import listeningLearning from "@/data/seed/listening-0001/learning.json";
import listeningReview from "@/data/seed/listening-0001/review.json";
import type {
  ListeningLearningDoc,
  ListeningReviewDoc,
  ReadingLearningDoc,
  ReadingReviewDoc,
  SessionCatalogDoc,
  SessionType,
} from "@/types/session";

const catalogDocs = [
  readingCatalog as SessionCatalogDoc,
  listeningCatalog as SessionCatalogDoc,
];

const learningDocs = new Map<
  string,
  ReadingLearningDoc | ListeningLearningDoc
>([
  ["reading-0001", readingLearning as ReadingLearningDoc],
  ["listening-0001", listeningLearning as ListeningLearningDoc],
]);

const reviewDocs = new Map<string, ReadingReviewDoc | ListeningReviewDoc>([
  ["reading-0001", readingReview as ReadingReviewDoc],
  ["listening-0001", listeningReview as ListeningReviewDoc],
]);

export function listFixtureCatalog(type: SessionType) {
  return catalogDocs
    .filter((item) => item.sessionType === type && item.isPublished)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);
}

export function getFixtureCatalogByNumber(
  type: SessionType,
  sessionNumber: number,
) {
  return (
    catalogDocs.find(
      (item) =>
        item.sessionType === type &&
        item.sessionNumber === sessionNumber &&
        item.isPublished,
    ) || null
  );
}

export function getFixtureLearning(sessionId: string) {
  return learningDocs.get(sessionId) || null;
}

export function getFixtureReview(sessionId: string) {
  return reviewDocs.get(sessionId) || null;
}
