import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n");
}

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

function getAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("Firebase Admin is not configured.");
  }

  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY!),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
