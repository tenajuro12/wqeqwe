import { createAction, props } from '@ngrx/store';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
  image?: string;
}

export interface CryptoState {
  assets: CryptoAsset[];
  selectedAssets: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'price' | 'change24h' | 'volume24h' | 'marketCap';
  sortOrder: 'asc' | 'desc';
}

export const loadCryptoData = createAction('[Crypto] Load Data');

export const loadCryptoDataSuccess = createAction(
  '[Crypto] Load Data Success',
  props<{ assets: CryptoAsset[] }>()
);

export const loadCryptoDataFailure = createAction(
  '[Crypto] Load Data Failure',
  props<{ error: string }>()
);

export const updateCryptoPrices = createAction(
  '[Crypto] Update Prices',
  props<{ updates: Partial<CryptoAsset>[] }>()
);

export const setSearchQuery = createAction(
  '[Crypto] Set Search Query',
  props<{ query: string }>()
);

export const toggleAssetSelection = createAction(
  '[Crypto] Toggle Asset Selection',
  props<{ assetId: string }>()
);

export const setSorting = createAction(
  '[Crypto] Set Sorting',
  props<{ sortBy: CryptoState['sortBy']; sortOrder: CryptoState['sortOrder'] }>()
);

export const retryFailedRequest = createAction('[Crypto] Retry Failed Request');
