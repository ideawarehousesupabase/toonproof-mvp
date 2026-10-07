import { useEffect, useState } from "react";
import type {
  Asset,
  AssetShare,
  Certificate,
  DashboardStats,
  Permissions,
  ProvenanceEvent,
} from "./types";
import { processAssetInput, type RawAssetInput } from "./processing-engine";
import { isFirebaseConfigured, db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";

export type {
  Asset,
  AssetShare,
  Certificate,
  DashboardStats,
  Permissions,
  ProvenanceEvent,
} from "./types";

const VAULT_STORAGE_KEY = "toonproof_mvp_vault_data";
const VAULT_EVENT = "toonproof-vault-mutation";

type LocalVaultStore = {
  assets: Asset[];
  permissions: Record<string, Permissions>;
  shares: AssetShare[];
  events: ProvenanceEvent[];
  certificates: Certificate[];
};

function readLocalVault(): LocalVaultStore {
  if (typeof window === "undefined") {
    return { assets: [], permissions: {}, shares: [], events: [], certificates: [] };
  }
  try {
    const raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocalVaultStore;
  } catch {
    /* ignore */
  }
  const empty: LocalVaultStore = {
    assets: [],
    permissions: {},
    shares: [],
    events: [],
    certificates: [],
  };
  window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(empty));
  return empty;
}

function writeLocalVault(store: LocalVaultStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(VAULT_EVENT));
}

// --------------------------------------------------------------------------
// ASSETS
// --------------------------------------------------------------------------

export function getAssets(userId?: string): Asset[] {
  const store = readLocalVault();
  if (!userId) return store.assets;
  return store.assets.filter((a) => a.userId === userId);
}

export function findAsset(assetId: string, userId?: string): Asset | undefined {
  const assets = getAssets(userId);
  return assets.find((a) => a.id === assetId);
}

/**
 * Primary user action: User provides raw data -> Centralized rule engine derives technical DNA & records.
 */
export async function registerAsset(
  userId: string,
  rawInput: RawAssetInput
): Promise<{ asset: Asset; events: ProvenanceEvent[] }> {
  const currentAssets = getAssets(userId);
  const processed = await processAssetInput(rawInput, userId, currentAssets.length);

  const asset: Asset = {
    id: processed.assetId,
    userId,
    name: rawInput.name.trim(),
    type: rawInput.type.trim(),
    registeredOn: processed.formattedDate,
    createdAt: new Date().toISOString(),
    status: "Verified",
    description: rawInput.description?.trim(),
    collection: rawInput.collection?.trim(),
    fileName: rawInput.fileName,
    fileSize: rawInput.fileSize,
    fileMimeType: rawInput.fileMimeType,
    dna: processed.dna,
  };

  const newEvents: ProvenanceEvent[] = processed.initialEvents.map((evt, idx) => ({
    ...evt,
    id: `evt_${Date.now()}_${idx}`,
    userId,
  }));

  // Update local vault store
  const store = readLocalVault();
  store.assets = [asset, ...store.assets];
  store.permissions[asset.id] = processed.defaultPermissions;
  store.events = [...newEvents, ...store.events];
  writeLocalVault(store);

  // Sync to Firebase if configured
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "assets", asset.id), asset);
      await setDoc(doc(db, "permissions", asset.id), {
        assetId: asset.id,
        userId,
        ...processed.defaultPermissions,
      });
      for (const evt of newEvents) {
        await setDoc(doc(db, "events", evt.id), evt);
      }
    } catch (err) {
      console.warn("Firestore asset sync notice:", err);
    }
  }

  return { asset, events: newEvents };
}

// --------------------------------------------------------------------------
// PERMISSIONS
// --------------------------------------------------------------------------

export function getPermissions(assetId: string): Permissions {
  const store = readLocalVault();
  if (store.permissions[assetId]) {
    return store.permissions[assetId];
  }
  return {
    general: {
      "Commercial Production": true,
      "Internal Studio Reuse": true,
      "Educational Use": true,
      "Derivative Creation": false,
      "Marketplace Distribution": false,
    },
    ai: {
      "Private AI Fine-Tuning": false,
      "Public AI Training": false,
      "Royalty-Based AI Usage": true,
    },
  };
}

export async function savePermissions(
  userId: string,
  assetId: string,
  permissions: Permissions
) {
  const store = readLocalVault();
  store.permissions[assetId] = permissions;

  const now = new Date();
  const event: ProvenanceEvent = {
    id: `evt_${Date.now()}`,
    assetId,
    userId,
    date: now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    timestamp: now.toISOString(),
    event: "Usage & AI permissions updated",
  };
  store.events = [event, ...store.events];
  writeLocalVault(store);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "permissions", assetId), {
        assetId,
        userId,
        ...permissions,
      });
      await setDoc(doc(db, "events", event.id), event);
    } catch (err) {
      console.warn("Firestore permissions sync notice:", err);
    }
  }
}

// --------------------------------------------------------------------------
// SHARES
// --------------------------------------------------------------------------

export function getShares(assetId: string, userId?: string): AssetShare[] {
  const store = readLocalVault();
  return store.shares.filter(
    (s) => s.assetId === assetId && (!userId || s.userId === userId)
  );
}

export async function addShare(
  userId: string,
  assetId: string,
  shareData: {
    name: string;
    email: string;
    access: string;
    expiry?: string;
  }
): Promise<AssetShare> {
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const shareCode = Math.random().toString(36).slice(2, 6).toUpperCase();

  const share: AssetShare = {
    id: `sh_${Date.now()}`,
    assetId,
    userId,
    name: shareData.name.trim(),
    email: shareData.email.trim(),
    access: shareData.access,
    expiry: shareData.expiry || "7 Days",
    date: formattedDate,
    status: "Active",
    shareCode,
  };

  const event: ProvenanceEvent = {
    id: `evt_${Date.now()}`,
    assetId,
    userId,
    date: formattedDate,
    timestamp: now.toISOString(),
    event: `Shared with ${share.name} (${share.access})`,
  };

  const store = readLocalVault();
  store.shares = [share, ...store.shares];
  store.events = [event, ...store.events];
  writeLocalVault(store);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "shares", share.id), share);
      await setDoc(doc(db, "events", event.id), event);
    } catch (err) {
      console.warn("Firestore share sync notice:", err);
    }
  }

  return share;
}

export async function revokeShare(userId: string, shareId: string) {
  const store = readLocalVault();
  const target = store.shares.find((s) => s.id === shareId);
  if (!target) return;

  store.shares = store.shares.map((s) =>
    s.id === shareId ? { ...s, status: "Revoked" as const } : s
  );

  const now = new Date();
  const event: ProvenanceEvent = {
    id: `evt_${Date.now()}`,
    assetId: target.assetId,
    userId,
    date: now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    timestamp: now.toISOString(),
    event: `Access revoked for ${target.name}`,
  };
  store.events = [event, ...store.events];
  writeLocalVault(store);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "shares", shareId), { status: "Revoked" }, { merge: true });
      await setDoc(doc(db, "events", event.id), event);
    } catch (err) {
      console.warn("Firestore revoke sync notice:", err);
    }
  }
}

// --------------------------------------------------------------------------
// PROVENANCE
// --------------------------------------------------------------------------

export function getProvenance(asset: Asset): ProvenanceEvent[] {
  const store = readLocalVault();
  const events = store.events.filter((e) => e.assetId === asset.id);
  if (events.length > 0) {
    return events;
  }
  // Fallback initial events if none registered
  return [
    {
      id: "evt_init_1",
      assetId: asset.id,
      userId: asset.userId,
      date: asset.registeredOn,
      timestamp: asset.createdAt,
      event: "Asset registered & classified",
    },
    {
      id: "evt_init_2",
      assetId: asset.id,
      userId: asset.userId,
      date: asset.registeredOn,
      timestamp: asset.createdAt,
      event: "Exact cryptographic fingerprint generated",
    },
    {
      id: "evt_init_3",
      assetId: asset.id,
      userId: asset.userId,
      date: asset.registeredOn,
      timestamp: asset.createdAt,
      event: "Perceptual visual fingerprint generated",
    },
    {
      id: "evt_init_4",
      assetId: asset.id,
      userId: asset.userId,
      date: asset.registeredOn,
      timestamp: asset.createdAt,
      event: "AI Permission Token assigned",
    },
    {
      id: "evt_init_5",
      assetId: asset.id,
      userId: asset.userId,
      date: asset.registeredOn,
      timestamp: asset.createdAt,
      event: "Initial provenance record created",
    },
  ];
}

// --------------------------------------------------------------------------
// CERTIFICATES
// --------------------------------------------------------------------------

export function certIdFor(assetId: string) {
  return "TPC-" + assetId.replace("TP-", "");
}

export function getCertificate(assetId: string, userId?: string): Certificate | undefined {
  const store = readLocalVault();
  return store.certificates.find(
    (c) => c.assetId === assetId && (!userId || c.userId === userId)
  );
}

export async function issueCertificate(
  userId: string,
  assetId: string
): Promise<Certificate> {
  const store = readLocalVault();
  const existing = store.certificates.find((c) => c.assetId === assetId);
  if (existing) return existing;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const certId = certIdFor(assetId);

  const asset = store.assets.find((a) => a.id === assetId);
  const hashSig = asset?.dna?.exactHash || `SIG_${Date.now()}`;

  const cert: Certificate = {
    id: certId,
    assetId,
    userId,
    date: dateStr,
    timestamp: now.toISOString(),
    status: "Valid",
    hashSignature: hashSig,
  };

  const event: ProvenanceEvent = {
    id: `evt_${Date.now()}`,
    assetId,
    userId,
    date: dateStr,
    timestamp: now.toISOString(),
    event: `Provenance certificate issued (${certId})`,
    hashSnippet: hashSig.slice(0, 16),
  };

  store.certificates = [cert, ...store.certificates];
  store.events = [event, ...store.events];
  writeLocalVault(store);

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, "certificates", cert.id), cert);
      await setDoc(doc(db, "events", event.id), event);
    } catch (err) {
      console.warn("Firestore certificate sync notice:", err);
    }
  }

  return cert;
}

export function listCertificates(userId?: string): Array<Certificate & { asset: Asset }> {
  const store = readLocalVault();
  const userAssets = getAssets(userId);
  const assetMap = new Map(userAssets.map((a) => [a.id, a]));

  const certs = userId
    ? store.certificates.filter((c) => c.userId === userId)
    : store.certificates;

  return certs
    .map((c) => {
      const asset = assetMap.get(c.assetId);
      if (!asset) return null;
      return { ...c, asset };
    })
    .filter((item): item is Certificate & { asset: Asset } => item !== null);
}

// --------------------------------------------------------------------------
// STATS
// --------------------------------------------------------------------------

export function getStats(userId?: string): DashboardStats {
  const assets = getAssets(userId);
  const store = readLocalVault();
  const userAssetIds = new Set(assets.map((a) => a.id));

  const activeShares = store.shares.filter(
    (s) =>
      s.status === "Active" &&
      userAssetIds.has(s.assetId) &&
      (!userId || s.userId === userId)
  ).length;

  const certificates = store.certificates.filter(
    (c) => userAssetIds.has(c.assetId) && (!userId || c.userId === userId)
  ).length;

  return {
    registered: assets.length,
    protected: assets.filter((a) => a.status === "Verified").length,
    activeShares,
    certificates,
  };
}

// --------------------------------------------------------------------------
// FIREBASE HYDRATION & REACTIVITY HOOK
// --------------------------------------------------------------------------

export async function syncVaultFromFirebase(userId: string) {
  if (!isFirebaseConfigured || !db || !userId) return;
  try {
    const [assetsSnap, permsSnap, sharesSnap, eventsSnap, certsSnap] = await Promise.all([
      getDocs(query(collection(db, "assets"), where("userId", "==", userId))),
      getDocs(query(collection(db, "permissions"), where("userId", "==", userId))),
      getDocs(query(collection(db, "shares"), where("userId", "==", userId))),
      getDocs(query(collection(db, "events"), where("userId", "==", userId))),
      getDocs(query(collection(db, "certificates"), where("userId", "==", userId))),
    ]);

    const fbAssets: Asset[] = assetsSnap.docs.map((d) => d.data() as Asset);
    const fbPerms: Record<string, Permissions> = {};
    permsSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.assetId) {
        fbPerms[data.assetId] = {
          general: data.general || {},
          ai: data.ai || {},
        } as Permissions;
      }
    });
    const fbShares: AssetShare[] = sharesSnap.docs.map((d) => d.data() as AssetShare);
    const fbEvents: ProvenanceEvent[] = eventsSnap.docs.map((d) => d.data() as ProvenanceEvent);
    const fbCerts: Certificate[] = certsSnap.docs.map((d) => d.data() as Certificate);

    const store = readLocalVault();

    // Merge assets
    const otherAssets = store.assets.filter((a) => a.userId !== userId);
    const userAssetMap = new Map<string, Asset>();
    store.assets.filter((a) => a.userId === userId).forEach((a) => userAssetMap.set(a.id, a));
    fbAssets.forEach((a) => userAssetMap.set(a.id, a));

    // Merge shares
    const otherShares = store.shares.filter((s) => s.userId !== userId);
    const userShareMap = new Map<string, AssetShare>();
    store.shares.filter((s) => s.userId === userId).forEach((s) => userShareMap.set(s.id, s));
    fbShares.forEach((s) => userShareMap.set(s.id, s));

    // Merge events
    const otherEvents = store.events.filter((e) => e.userId !== userId);
    const userEventMap = new Map<string, ProvenanceEvent>();
    store.events.filter((e) => e.userId === userId).forEach((e) => userEventMap.set(e.id, e));
    fbEvents.forEach((e) => userEventMap.set(e.id, e));

    // Merge certificates
    const otherCerts = store.certificates.filter((c) => c.userId !== userId);
    const userCertMap = new Map<string, Certificate>();
    store.certificates.filter((c) => c.userId === userId).forEach((c) => userCertMap.set(c.id, c));
    fbCerts.forEach((c) => userCertMap.set(c.id, c));

    store.assets = [...userAssetMap.values(), ...otherAssets];
    store.permissions = { ...store.permissions, ...fbPerms };
    store.shares = [...userShareMap.values(), ...otherShares];
    store.events = [...userEventMap.values(), ...otherEvents];
    store.certificates = [...userCertMap.values(), ...otherCerts];

    writeLocalVault(store);
  } catch (err) {
    console.warn("Firestore vault sync notice:", err);
  }
}

export function useVault(userId?: string) {
  const [, setTick] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(VAULT_EVENT, bump);
    window.addEventListener("storage", bump);

    if (userId && isFirebaseConfigured) {
      syncVaultFromFirebase(userId);
    }

    return () => {
      window.removeEventListener(VAULT_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, [userId]);

  return ready;
}

export function formatToday() {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
