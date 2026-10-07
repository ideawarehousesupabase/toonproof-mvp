export type CreatorType =
  | "Animator"
  | "Rig Artist"
  | "Illustrator"
  | "Animation Student"
  | "Small Animation Studio";

export const CREATOR_TYPES: CreatorType[] = [
  "Animator",
  "Rig Artist",
  "Illustrator",
  "Animation Student",
  "Small Animation Studio",
];

export const ASSET_TYPES = [
  "Character Design",
  "2D Rig",
  "Expression Sheet",
  "Mouth-Shape Set",
  "Background Pack",
  "Prop",
  "Motion Loop",
  "Walk Cycle",
  "Storyboard",
  "Style Guide",
] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

export const FILTERS = ["All", "Character", "Rig", "Motion", "Background", "Other"] as const;
export type Filter = (typeof FILTERS)[number];

export function matchesFilter(type: string, filter: Filter) {
  switch (filter) {
    case "All":
      return true;
    case "Character":
      return type === "Character Design" || type === "Expression Sheet";
    case "Rig":
      return type === "2D Rig" || type === "Mouth-Shape Set";
    case "Motion":
      return type === "Motion Loop" || type === "Walk Cycle";
    case "Background":
      return type === "Background Pack" || type === "Prop";
    case "Other":
      return ["Storyboard", "Style Guide"].includes(type);
  }
}

export type User = {
  id: string;
  fullName: string;
  email: string;
  creatorType: CreatorType;
  createdAt: string;
};

export type AssetDNA = {
  exactHash: string;
  perceptualHash: string;
  aiPermissionToken: string;
  shapeSignature?: string;
  motionSignature?: string;
  styleEmbeddingSummary?: string;
  completeness?: number;
  riskScore?: string;
};

export type Asset = {
  id: string;
  userId: string;
  name: string;
  type: string;
  registeredOn: string;
  createdAt: string;
  status: "Verified";
  description?: string;
  collection?: string;
  fileName?: string;
  fileSize?: string;
  fileMimeType?: string;
  dna: AssetDNA;
};

export type Permissions = {
  general: Record<string, boolean>;
  ai: Record<string, boolean>;
};

export type ProvenanceEvent = {
  id: string;
  assetId: string;
  userId: string;
  date: string;
  timestamp: string;
  event: string;
  hashSnippet?: string;
};

export type AssetShare = {
  id: string;
  assetId: string;
  userId: string;
  name: string;
  email: string;
  access: string;
  expiry?: string;
  date: string;
  status: "Active" | "Revoked";
  shareCode?: string;
};

export type Certificate = {
  id: string;
  assetId: string;
  userId: string;
  date: string;
  timestamp: string;
  status: "Valid";
  hashSignature: string;
};

export type DashboardStats = {
  registered: number;
  protected: number;
  activeShares: number;
  certificates: number;
};
