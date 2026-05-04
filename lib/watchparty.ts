"use client"

import {
  doc, setDoc, getDoc, updateDoc, deleteDoc,
  collection, getDocs, serverTimestamp,
  writeBatch,
} from "firebase/firestore"
import { db } from "./firebase"
import type { WatchPartyRoom } from "./types"

export const ROOM_DURATION_MS = 3 * 60 * 60 * 1000 // 3 hours

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

// ─── Create a new room ────────────────────────────────────────────────────────

export interface CreateRoomParams {
  hostId: string
  hostName: string
  hostAvatar: string
  animeSlug: string
  animeTitle: string
  animePoster: string
  episodeSlug: string
  episodeTitle: string
  iframeSrc: string
}

export async function createWatchPartyRoom(params: CreateRoomParams): Promise<string> {
  const roomId = generateRoomId()
  const now = Date.now()

  await setDoc(doc(db, "watchparty", roomId), {
    roomId,
    hostId: params.hostId,
    hostName: params.hostName,
    hostAvatar: params.hostAvatar,
    animeSlug: params.animeSlug,
    animeTitle: params.animeTitle,
    animePoster: params.animePoster,
    episodeSlug: params.episodeSlug,
    episodeTitle: params.episodeTitle,
    iframeSrc: params.iframeSrc,
    members: [params.hostId],
    memberNames: { [params.hostId]: params.hostName },
    memberAvatars: { [params.hostId]: params.hostAvatar },
    createdAt: serverTimestamp(),
    expiresAt: now + ROOM_DURATION_MS,
    updatedAt: now,
  } satisfies Omit<WatchPartyRoom, "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> })

  return roomId
}

// ─── Update episode (host only) — resets 3h timer ────────────────────────────

export async function updateRoomEpisode(
  roomId: string,
  episodeSlug: string,
  episodeTitle: string,
  iframeSrc: string
): Promise<void> {
  const now = Date.now()
  await updateDoc(doc(db, "watchparty", roomId), {
    episodeSlug,
    episodeTitle,
    iframeSrc,
    expiresAt: now + ROOM_DURATION_MS,
    updatedAt: now,
  })
}

// ─── Join room (add member) ───────────────────────────────────────────────────

export async function joinRoom(
  roomId: string,
  userId: string,
  userName: string,
  userAvatar: string
): Promise<WatchPartyRoom | null> {
  const ref = doc(db, "watchparty", roomId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  const data = snap.data() as WatchPartyRoom

  // Check expiry
  if (data.expiresAt && Date.now() > data.expiresAt) {
    await deleteRoom(roomId)
    return null
  }

  if (!data.members.includes(userId)) {
    await updateDoc(ref, {
      members: [...data.members, userId],
      [`memberNames.${userId}`]: userName,
      [`memberAvatars.${userId}`]: userAvatar,
    })
  }

  return { ...data, roomId }
}

// ─── Delete room ──────────────────────────────────────────────────────────────
// Strategy:
//   1. Delete the room doc first — this is what the host is allowed to do.
//      All members see the room disappear via onSnapshot immediately.
//   2. Then try to clean up messages in a best-effort batch.
//      If this fails (e.g. rules), the room is already gone so it's fine.

export async function deleteRoom(roomId: string): Promise<void> {
  // Step 1: delete the room document (host permission required)
  await deleteDoc(doc(db, "watchparty", roomId))

  // Step 2: clean up messages best-effort (don't await, don't throw)
  getDocs(collection(db, "watchparty", roomId, "messages"))
    .then((snap) => {
      if (snap.empty) return
      const batch = writeBatch(db)
      snap.docs.forEach((d) => batch.delete(d.ref))
      return batch.commit()
    })
    .catch(() => {
      // Messages cleanup failed — acceptable, room is already deleted
    })
}

// Keep old name as alias for backward compat
export const deleteExpiredRoom = deleteRoom

// ─── Get all rooms a user is member of ───────────────────────────────────────

export async function getUserRooms(userId: string): Promise<WatchPartyRoom[]> {
  const { query, collection: col, where, getDocs: gd } = await import("firebase/firestore")
  const q = query(col(db, "watchparty"), where("members", "array-contains", userId))
  const snap = await gd(q)

  const now = Date.now()
  const rooms: WatchPartyRoom[] = []
  const expired: string[] = []

  snap.docs.forEach((d) => {
    const data = d.data() as WatchPartyRoom
    if (data.expiresAt && now > data.expiresAt) {
      expired.push(d.id)
    } else {
      rooms.push({ ...data, roomId: d.id })
    }
  })

  // Clean up expired rooms in background
  expired.forEach((id) => deleteRoom(id).catch(() => {}))

  return rooms.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}
