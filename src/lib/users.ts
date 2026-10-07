import { useEffect, useState } from "react";
import type { CreatorType, User } from "./types";
import { isFirebaseConfigured, auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

export { CREATOR_TYPES, type CreatorType, type User } from "./types";

const USERS_KEY = "toonproof_mvp_users";
const SESSION_KEY = "toonproof_mvp_session";
const AUTH_EVENT = "toonproof-auth-change";

export type Session = User;

function readLocalUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "[]") as User[];
  } catch {
    return [];
  }
}

function writeLocalUsers(users: User[]) {
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

export async function createUser(input: {
  fullName: string;
  email: string;
  password?: string;
  creatorType: CreatorType;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const now = new Date().toISOString();

  // 1. Try Firebase Auth if configured
  if (isFirebaseConfigured && auth && db && input.password) {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, input.password);
      const user: User = {
        id: userCred.user.uid,
        fullName,
        email,
        creatorType: input.creatorType,
        createdAt: now,
      };
      await setDoc(doc(db, "users", user.id), user);
      saveSession(user);
      return { ok: true, user };
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        return { ok: false, error: "An account with this email already exists." };
      }
      if (err?.code === "auth/weak-password") {
        return { ok: false, error: "Password should be at least 6 characters." };
      }
      return { ok: false, error: err?.message || "Failed to create account in Firebase." };
    }
  }

  // 2. Local resilient user repository
  const users = readLocalUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user: User = {
    id: "usr_" + Math.random().toString(36).slice(2, 11),
    fullName,
    email,
    creatorType: input.creatorType,
    createdAt: now,
  };

  writeLocalUsers([...users, user]);
  saveSession(user);
  return { ok: true, user };
}

export async function findUserByCredentials(
  email: string,
  password?: string
): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const targetEmail = email.trim().toLowerCase();

  // 1. Try Firebase Auth if configured
  if (isFirebaseConfigured && auth && db && password) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, targetEmail, password);
      const docSnap = await getDoc(doc(db, "users", userCred.user.uid));
      let user: User;
      if (docSnap.exists()) {
        user = docSnap.data() as User;
      } else {
        user = {
          id: userCred.user.uid,
          fullName: targetEmail.split("@")[0],
          email: targetEmail,
          creatorType: "Animator",
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "users", user.id), user);
      }
      saveSession(user);
      return { ok: true, user };
    } catch (err: any) {
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password") {
        return { ok: false, error: "Invalid email or password." };
      }
      return { ok: false, error: err?.message || "Authentication failed." };
    }
  }

  // 2. Local user repository
  const users = readLocalUsers();
  const found = users.find((u) => u.email === targetEmail);
  if (!found) {
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
    users[index] = updated;
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

  if (isFirebaseConfigured && auth && db) {
    try {
      if (auth.currentUser && auth.currentUser.uid === id) {
        await auth.currentUser.delete();
      }
      await deleteDoc(doc(db, "users", id));
    } catch (err) {
      console.warn("Firebase user delete notice:", err);
    }
  }
}

export async function logoutUser() {
  clearSession();
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
  }
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
