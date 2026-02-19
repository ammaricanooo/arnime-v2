"use client"

import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  getRedirectResult,
  type User,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

if (!getApps().length) {
  initializeApp(firebaseConfig)
}

export const auth = getAuth()
export const provider = new GoogleAuthProvider()
export const db = getFirestore()

export async function signInWithGoogle() {
  const isMobile =
    typeof window !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (isMobile) {
    return signInWithPopup(auth, provider)
  }

  return signInWithPopup(auth, provider)
}

export async function signOutUser() {
  return signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function handleRedirectResult() {
  try {
    return await getRedirectResult(auth)
  } catch (err) {
    console.error("Redirect error:", err)
  }
}
