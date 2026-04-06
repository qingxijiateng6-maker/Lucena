import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import readingCatalog from "@/data/seed/reading-0001/catalog.json";
import readingLearning from "@/data/seed/reading-0001/learning.json";
import readingReview from "@/data/seed/reading-0001/review.json";
import listeningCatalog from "@/data/seed/listening-0001/catalog.json";
import listeningLearning from "@/data/seed/listening-0001/learning.json";
import listeningReview from "@/data/seed/listening-0001/review.json";

function withServerTimestamps<T extends Record<string, unknown>>(value: T) {
  return {
    ...value,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

async function main() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin env vars are missing. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY first.",
    );
  }

  const db = getAdminDb();
  const catalogDocs = [readingCatalog, listeningCatalog];
  const learningDocs = [readingLearning, listeningLearning];
  const reviewDocs = [readingReview, listeningReview];

  for (const doc of catalogDocs) {
    await db
      .collection("sessions_catalog")
      .doc(doc.sessionId)
      .set(withServerTimestamps(doc));
  }

  for (const doc of learningDocs) {
    await db.collection("sessions_learning").doc(doc.sessionId).set(doc);
  }

  for (const doc of reviewDocs) {
    await db.collection("sessions_review").doc(doc.sessionId).set(doc);
  }

  console.log("Seeded catalog, learning, and review documents.");
}

void main();
