// Domain exports and legacy bridges (All data is now real & user-isolated in Firebase / Vault)

export {
  ASSET_TYPES,
  FILTERS,
  matchesFilter,
  type Asset,
  type AssetType,
  type Filter,
  type User,
  type CreatorType,
  type AssetShare as Share,
} from "./types";

export {
  getAssets as allAssets,
  getAssets as getRegisteredAssets,
  findAsset,
  formatToday,
} from "./vault";
