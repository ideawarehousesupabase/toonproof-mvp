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
  runTransaction,
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

function writeLocalVault(store: LocalVaultStore, keepPreviewFor?: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    // Browser storage full — drop cached previews from the oldest assets until it fits.
    // (Previews remain in Firestore when configured and are re-synced on next load.)
    const withPreview = store.assets
      .filter((a) => a.thumbnail && a.id !== keepPreviewFor)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    let saved = false;
    for (let i = withPreview.length - 1; i >= 0 && !saved; i--) {
      delete withPreview[i]!.thumbnail;
      try {
        window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(store));
        saved = true;
      } catch {
        // keep trimming
      }
    }
    if (!saved) {
      console.warn("Local vault storage notice:", err);
      throw new Error(
        "Your browser storage is full, so this change couldn't be saved. Clear some site data for this app and try again.",
      );
    }
  }
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

// --------------------------------------------------------------------------
// IDS — separate, ever-increasing sequences; a number is never reused, even after deletes
//   Assets:        TP-10001, TP-10002, …
//   Certificates:  TPC-50001, TPC-50002, …
// --------------------------------------------------------------------------

const COUNTERS_KEY = "toonproof_mvp_counters";

type Sequence = "assets" | "certificates";

const SEQUENCES: Record<Sequence, { prefix: string; start: number; end: number }> = {
  assets: { prefix: "TP-", start: 10001, end: 49999 },
  certificates: { prefix: "TPC-", start: 50001, end: 999999 },
};

function sequenceNumber(kind: Sequence, id: string): number | undefined {
  const { prefix, start, end } = SEQUENCES[kind];
  const match = new RegExp(`^${prefix}(\\d+)$`).exec(id);
  const n = match ? Number(match[1]) : NaN;
  return n >= start && n <= end ? n : undefined;
}

function highestNumber(kind: Sequence, ids: string[]): number {
  let max = SEQUENCES[kind].start - 1;
  for (const id of ids) {
    const n = sequenceNumber(kind, id);
    if (n !== undefined && n > max) max = n;
  }
  return max;
}

function localIds(kind: Sequence): string[] {
  const store = readLocalVault();
  return kind === "assets" ? store.assets.map((a) => a.id) : store.certificates.map((c) => c.id);
}

function readLocalCounters(): Record<Sequence, number> {
  const fallback = { assets: 0, certificates: 0 };
  if (typeof window === "undefined") return fallback;
  try {
    return { ...fallback, ...JSON.parse(window.localStorage.getItem(COUNTERS_KEY) ?? "{}") };
  } catch {
    return fallback;
  }
}

function rememberLocalCounter(kind: Sequence, value: number) {
  if (typeof window === "undefined") return;
  const counters = readLocalCounters();
  counters[kind] = Math.max(counters[kind], value);
  try {
    window.localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
  } catch {
    // non-critical
  }
}

/** Atomically reserves the next number of a sequence. */
async function reserveNumber(kind: Sequence): Promise<number> {
  const floor = Math.max(
    highestNumber(kind, localIds(kind)),
    readLocalCounters()[kind] || 0,
  );

  if (isFirebaseConfigured && db) {
    const firestore = db;
    try {
      const next = await runTransaction(firestore, async (tx) => {
        const ref = doc(firestore, "counters", kind);
        const snap = await tx.get(ref);
        let last = Number(snap.exists() ? snap.data()["last"] : NaN);
        if (!Number.isFinite(last)) {
          // First use: continue after the highest ID already in the registry
          const existing = await getDocs(collection(firestore, kind));
          last = highestNumber(
            kind,
            existing.docs.map((d) => d.id),
          );
        }
        const value = Math.max(last, floor) + 1;
        tx.set(ref, { last: value, updatedAt: new Date().toISOString() }, { merge: true });
        return value;
      });
      rememberLocalCounter(kind, next);
      return next;
    } catch (err) {
      console.warn("Firestore ID counter notice:", err);
    }
  }

  const next = floor + 1;
  rememberLocalCounter(kind, next);
  return next;
}

async function idTaken(kind: Sequence, id: string): Promise<boolean> {
  if (localIds(kind).includes(id)) return true;
  if (isFirebaseConfigured && db) {
    try {
      return (await getDoc(doc(db, kind, id))).exists();
    } catch {
      // can't check — accept
    }
  }
  return false;
}

/** Next unused ID of a sequence, e.g. "TP-10007" or "TPC-50003". */
async function nextId(kind: Sequence): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const id = `${SEQUENCES[kind].prefix}${await reserveNumber(kind)}`;
    if (!(await idTaken(kind, id))) return id;
  }
  throw new Error("Couldn't allocate a new ID. Please try again.");
}

/**
 * Primary user action: User provides raw data -> Centralized rule engine derives technical DNA & records.
 */
export async function registerAsset(
  userId: string,
  rawInput: RawAssetInput
): Promise<{ asset: Asset; events: ProvenanceEvent[] }> {
  const assetId = await nextId("assets");
  const processed = await processAssetInput(rawInput, userId, assetId);

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
    // Only set when present — Firestore rejects undefined field values
    ...(rawInput.thumbnail ? { thumbnail: rawInput.thumbnail } : {}),
    ...(rawInput.thumbnail && rawInput.previewSource
      ? { previewSource: rawInput.previewSource }
      : {}),
    ...(rawInput.fileHash ? { hashedFromFile: true } : {}),
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
  writeLocalVault(store, asset.id);

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

/**
 * True when a cloud record is missing or belongs to this user. Assets registered before IDs
 * became unique can share an ID with another user's record, which must never be touched.
 */
async function ownsCloudDoc(path: "assets" | "permissions", id: string, userId: string) {
  if (!isFirebaseConfigured || !db) return false;
  const snap = await getDoc(doc(db, path, id));
  return !snap.exists() || snap.data()["userId"] === userId;
}

/**
 * Attach or replace the preview image of an existing asset (e.g. assets registered
 * before previews existed, or file types the browser cannot render).
 */
export async function updateAssetPreview(userId: string, assetId: string, thumbnail: string) {
  const store = readLocalVault();
  const target = store.assets.find((a) => a.id === assetId && a.userId === userId);
  if (!target) throw new Error("Asset not found in your vault.");

  const hadPreview = Boolean(target.thumbnail);
  target.thumbnail = thumbnail;
  target.previewSource = "manual";

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
    event: hadPreview ? "Preview image replaced by creator" : "Preview image added by creator",
  };
  store.events = [event, ...store.events];
  writeLocalVault(store, assetId);

  if (isFirebaseConfigured && db) {
    try {
      if (await ownsCloudDoc("assets", assetId, userId)) {
        await setDoc(
          doc(db, "assets", assetId),
          { thumbnail, previewSource: "manual" },
          { merge: true },
        );
      }
      await setDoc(doc(db, "events", event.id), event);
    } catch (err) {
      console.warn("Firestore preview sync notice:", err);
    }
  }
}

export type AssetInfoPatch = {
  name: string;
  type: string;
  description: string;
  collection: string;
};

/** Edit the descriptive details of an asset. File, fingerprints, ID and dates never change. */
export async function updateAssetInfo(userId: string, assetId: string, patch: AssetInfoPatch) {
  const store = readLocalVault();
  const target = store.assets.find((a) => a.id === assetId && a.userId === userId);
  if (!target) throw new Error("Asset not found in your vault.");

  const next: AssetInfoPatch = {
    name: patch.name.trim(),
    type: patch.type.trim(),
    description: patch.description.trim(),
    collection: patch.collection.trim(),
  };
  if (!next.name) throw new Error("Asset name can't be empty.");
  if (!next.type) throw new Error("Please choose an asset type.");

  const labels: Record<keyof AssetInfoPatch, string> = {
    name: "name",
    type: "type",
    description: "description",
    collection: "project / collection",
  };
  const changed = (Object.keys(next) as Array<keyof AssetInfoPatch>).filter(
    (k) => (target[k] ?? "") !== next[k],
  );
  if (changed.length === 0) return;

  Object.assign(target, next);

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
    event: `Asset details updated (${changed.map((k) => labels[k]).join(", ")})`,
  };
  store.events = [event, ...store.events];
  writeLocalVault(store);

  if (isFirebaseConfigured && db) {
    try {
      if (await ownsCloudDoc("assets", assetId, userId)) {
        await setDoc(doc(db, "assets", assetId), next, { merge: true });
      }
      await setDoc(doc(db, "events", event.id), event);
    } catch (err) {
      console.warn("Firestore asset update notice:", err);
    }
  }
}

/** Permanently delete an asset together with its certificate, shares, permissions and history. */
export async function deleteAsset(userId: string, assetId: string) {
  const store = readLocalVault();
  const target = store.assets.find((a) => a.id === assetId && a.userId === userId);
  if (!target) throw new Error("Asset not found in your vault.");

  // Match on owner too: assets registered before IDs became unique can share an ID across users
  const owned = (x: { assetId: string; userId: string }) =>
    x.assetId === assetId && x.userId === userId;
  const certIds = store.certificates.filter(owned).map((c) => c.id);
  const shareIds = store.shares.filter(owned).map((s) => s.id);
  const eventIds = store.events.filter(owned).map((e) => e.id);

  store.assets = store.assets.filter((a) => a !== target);
  store.certificates = store.certificates.filter((c) => !owned(c));
  store.shares = store.shares.filter((s) => !owned(s));
  store.events = store.events.filter((e) => !owned(e));
  delete store.permissions[assetId];
  writeLocalVault(store);

  if (isFirebaseConfigured && db) {
    const firestore = db;
    try {
      const [ownsAsset, ownsPermissions] = await Promise.all([
        ownsCloudDoc("assets", assetId, userId),
        ownsCloudDoc("permissions", assetId, userId),
      ]);
      await Promise.all([
        ownsAsset ? deleteDoc(doc(firestore, "assets", assetId)) : Promise.resolve(),
        ownsPermissions ? deleteDoc(doc(firestore, "permissions", assetId)) : Promise.resolve(),
        ...certIds.map((id) => deleteDoc(doc(firestore, "certificates", id))),
        ...shareIds.map((id) => deleteDoc(doc(firestore, "shares", id))),
        ...eventIds.map((id) => deleteDoc(doc(firestore, "events", id))),
      ]);
    } catch (err) {
      console.warn("Firestore asset delete notice:", err);
    }
  }
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

export function getCertificate(assetId: string, userId?: string): Certificate | undefined {
  const store = readLocalVault();
  return store.certificates.find(
    (c) => c.assetId === assetId && (!userId || c.userId === userId)
  );
}

export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  if (!domain) return "";
  const visible = local.slice(0, Math.min(2, Math.max(1, local.length - 1)));
  return `${visible}***@${domain}`;
}

/** Why a certificate can't be issued for this asset yet, or undefined when it can. */
export function certificateBlocker(asset: Asset | undefined): string | undefined {
  if (!asset) return "Asset not found in your vault.";
  if (!asset.fileName) {
    return "This asset has no uploaded file. Register the asset with its file to generate a certificate.";
  }
  if (!asset.thumbnail) {
    return "Add a preview image of this asset (Overview tab) before generating its certificate.";
  }
  return undefined;
}

export async function issueCertificate(
  userId: string,
  assetId: string,
  owner?: { name: string; email: string },
): Promise<Certificate> {
  const store = readLocalVault();
  const asset = store.assets.find((a) => a.id === assetId && a.userId === userId);
  const blocker = certificateBlocker(asset);
  if (blocker || !asset) throw new Error(blocker);

  const ownerFields = owner
    ? { ownerName: owner.name.trim(), ownerEmail: maskEmail(owner.email) }
    : {};

  const existing = store.certificates.find((c) => c.assetId === assetId && c.userId === userId);
  if (existing) {
    // Refresh owner details on certificates issued before they were recorded
    if (owner && (!existing.ownerName || !existing.ownerEmail)) {
      Object.assign(existing, ownerFields);
      writeLocalVault(store);
      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, "certificates", existing.id), existing, { merge: true });
        } catch (err) {
          console.warn("Firestore certificate sync notice:", err);
        }
      }
    }
    return existing;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const certId = await nextId("certificates");
  const hashSig = asset.dna?.exactHash || `SIG_${Date.now()}`;

  const cert: Certificate = {
    id: certId,
    assetId,
    userId,
    date: dateStr,
    timestamp: now.toISOString(),
    status: "Valid",
    hashSignature: hashSig,
    ...ownerFields,
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

export async function deleteCertificate(userId: string, certId: string) {
  const store = readLocalVault();
  const target = store.certificates.find((c) => c.id === certId && c.userId === userId);
  if (!target) throw new Error("Certificate not found.");

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
    event: `Provenance certificate deleted (${certId})`,
  };

  store.certificates = store.certificates.filter((c) => c !== target);
  store.events = [event, ...store.events];
  writeLocalVault(store);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "certificates", certId));
      await setDoc(doc(db, "events", event.id), event);
    } catch (err) {
      console.warn("Firestore certificate delete notice:", err);
    }
  }
}

/**
 * Public certificate lookup used by the verification page (no sign-in required).
 */
export async function lookupCertificate(
  certId: string,
): Promise<{ cert: Certificate; asset: Asset | undefined } | null> {
  const id = certId.trim().toUpperCase();
  if (!id) return null;

  if (isFirebaseConfigured && db) {
    try {
      const certSnap = await getDoc(doc(db, "certificates", id));
      if (certSnap.exists()) {
        const cert = certSnap.data() as Certificate;
        const assetSnap = await getDoc(doc(db, "assets", cert.assetId));
        return { cert, asset: assetSnap.exists() ? (assetSnap.data() as Asset) : undefined };
      }
      // Not in Firestore — fall back to this browser's vault below
    } catch (err) {
      console.warn("Firestore certificate lookup notice:", err);
    }
  }

  const store = readLocalVault();
  const cert = store.certificates.find((c) => c.id === id);
  if (!cert) return null;
  return { cert, asset: store.assets.find((a) => a.id === cert.assetId) };
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
    fbAssets.forEach((a) => {
      // Keep a locally saved preview if the cloud copy doesn't have one yet
      const local = userAssetMap.get(a.id);
      if (local?.thumbnail && !a.thumbnail) {
        a.thumbnail = local.thumbnail;
        if (local.previewSource) a.previewSource = local.previewSource;
      }
      userAssetMap.set(a.id, a);
    });

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
