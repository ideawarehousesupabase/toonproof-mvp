import { useEffect, useState } from "react";
import type { CreatorType, User } from "./types";
import { isFirebaseConfigured, db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";

export { CREATOR_TYPES, type CreatorType, type User } from "./types";

const USERS_KEY = "toonproof_mvp_users";
const SESSION_KEY = "toonproof_mvp_session";
const AUTH_EVENT = "toonproof-auth-change";

export type Session = User;

type StoredUser = User & { password?: string };

function readLocalUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: User) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/**
 * Create user account using pure Firestore CRUD operations + local resilient cache.
 */
export async function createUser(input: {
  fullName: string;
  email: string;
  password?: string;
  creatorType: CreatorType;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const now = new Date().toISOString();

  // 1. If Firebase Firestore is configured, perform CRUD against "users" collection
  if (isFirebaseConfigured && db) {
    try {
      // Check if email already exists in Firestore
      const q = query(collection(db, "users"), where("email", "==", email));
      const existingSnap = await getDocs(q);
      if (!existingSnap.empty) {
        return { ok: false, error: "An account with this email already exists." };
      }

      const userId = "usr_" + Math.random().toString(36).slice(2, 11);
      const userDoc: StoredUser = {
        id: userId,
        fullName,
        email,
        password: input.password,
        creatorType: input.creatorType,
        createdAt: now,
      };

      await setDoc(doc(db, "users", userId), userDoc);

      const publicUser: User = {
        id: userId,
        fullName,
        email,
        creatorType: input.creatorType,
        createdAt: now,
      };

      const localUsers = readLocalUsers();
      writeLocalUsers([...localUsers.filter((u) => u.email !== email), userDoc]);
      saveSession(publicUser);
      return { ok: true, user: publicUser };
    } catch (err: any) {
      console.warn("Firestore createUser notice:", err);
      // fallback to local below if network/permission issue
    }
  }

  // 2. Local fallback user repository
  const users = readLocalUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const userId = "usr_" + Math.random().toString(36).slice(2, 11);
  const user: StoredUser = {
    id: userId,
    fullName,
    email,
    password: input.password,
    creatorType: input.creatorType,
    createdAt: now,
  };

  writeLocalUsers([...users, user]);
  saveSession(user);
  return { ok: true, user };
}

/**
 * Sign in user by searching Firestore "users" collection + local cache.
 */
export async function findUserByCredentials(
  email: string,
  password?: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const targetEmail = email.trim().toLowerCase();

  // 1. If Firestore is configured, query "users" collection
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "users"), where("email", "==", targetEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data() as StoredUser;
        if (password && docData.password && docData.password !== password) {
          return { ok: false, error: "Invalid email or password." };
        }
        const publicUser: User = {
          id: docData.id || snap.docs[0].id,
          fullName: docData.fullName || targetEmail.split("@")[0],
          email: docData.email,
          creatorType: docData.creatorType || "Animator",
          createdAt: docData.createdAt || new Date().toISOString(),
        };

        const localUsers = readLocalUsers();
        writeLocalUsers([...localUsers.filter((u) => u.id !== publicUser.id), docData]);
        saveSession(publicUser);
        return { ok: true, user: publicUser };
      }
    } catch (err: any) {
      console.warn("Firestore findUser notice:", err);
    }
  }

  // 2. Local fallback user repository
  const users = readLocalUsers();
  const found = users.find((u) => u.email === targetEmail);
  if (!found) {
    return { ok: false, error: "Invalid email or password." };
  }
  if (password && found.password && found.password !== password) {
    return { ok: false, error: "Invalid email or password." };
  }

  saveSession(found);
  return { ok: true, user: found };
}

export function getUserById(id: string): User | null {
  const session = getSession();
  if (session && session.id === id) return session;
  const users = readLocalUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<User, "fullName" | "creatorType">>
): Promise<User | null> {
  const users = readLocalUsers();
  const index = users.findIndex((u) => u.id === id);
  let updated: User | null = null;

  if (index !== -1) {
    updated = { ...users[index], ...patch };
    users[index] = updated as StoredUser;
    writeLocalUsers(users);
  } else {
    const session = getSession();
    if (session && session.id === id) {
      updated = { ...session, ...patch };
    }
  }

  if (updated) {
    saveSession(updated);
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, "users", id), updated, { merge: true });
      } catch (err) {
        console.warn("Firestore user update sync:", err);
      }
    }
  }

  return updated;
}

export async function deleteUser(id: string) {
  writeLocalUsers(readLocalUsers().filter((u) => u.id !== id));
  clearSession();

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "users", id));
    } catch (err) {
      console.warn("Firestore user delete notice:", err);
    }
  }
}

export async function logoutUser() {
  clearSession();
}

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(getSession());

  useEffect(() => {
    const update = () => setSession(getSession());
    window.addEventListener(AUTH_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(AUTH_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return session;
}
