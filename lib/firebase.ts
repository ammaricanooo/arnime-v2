"use client"

import { initializeApp, getApps } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
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
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
export const db = getFirestore()

// Keep backward-compat export
export const provider = googleProvider

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function signInWithGithub() {
  return signInWithPopup(auth, githubProvider)
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
  } catch {
    // non-critical
  }
}
