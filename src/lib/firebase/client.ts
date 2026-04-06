"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";

let clientApp: FirebaseApp | null = null;

export function isFirebaseClientConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

function getClientApp() {
  if (!isFirebaseClientConfigured()) {
    throw new Error("Firebase client config is missing.");
  }

  if (clientApp) {
    return clientApp;
  }

  clientApp =
    getApps()[0] ??
    initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });

  return clientApp;
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export async function signInWithGoogleForSessionExchange() {
  const auth = getAuth(getClientApp());
  await setPersistence(auth, inMemoryPersistence);

  const result = await signInWithPopup(auth, createGoogleProvider());
  const idToken = await result.user.getIdToken();

  await signOut(auth);
  return idToken;
}

export async function signOutFirebaseClient() {
  if (!isFirebaseClientConfigured()) {
    return;
  }

  const auth = getAuth(getClientApp());
  await signOut(auth);
}
