import { createReducer, on } from '@ngrx/store';
import * as CryptoActions from './crypto.actions';
import { CryptoState } from './crypto.actions';

export const initialState: CryptoState = {
  assets: [],
  selectedAssets: [],
  loading: false,
  error: null,
  searchQuery: '',
  sortBy: 'marketCap',
  sortOrder: 'desc'
};

export const cryptoReducer = createReducer(
  initialState,

  on(CryptoActions.loadCryptoData, (state): CryptoState => ({
    ...state,
    loading: true,
    error: null
  })),

  on(CryptoActions.loadCryptoDataSuccess, (state, { assets }): CryptoState => ({
    ...state,
    assets: assets,
    loading: false,
    error: null
  })),

  on(CryptoActions.loadCryptoDataFailure, (state, { error }): CryptoState => ({
    ...state,
    loading: false,
    error
  })),

  on(CryptoActions.updateCryptoPrices, (state, { updates }): CryptoState => {
    const updatesMap = new Map(updates.map(u => [u.id, u]));

    return {
      ...state,
      assets: state.assets.map(asset => {
        const update = updatesMap.get(asset.id);
        return update ? { ...asset, ...update } : asset;
      })
    };
  }),

  on(CryptoActions.setSearchQuery, (state, { query }): CryptoState => ({
    ...state,
    searchQuery: query
  })),

  on(CryptoActions.toggleAssetSelection, (state, { assetId }): CryptoState => {
    const isSelected = state.selectedAssets.includes(assetId);

    return {
      ...state,
      selectedAssets: isSelected
        ? state.selectedAssets.filter(id => id !== assetId)
        : [...state.selectedAssets, assetId]
    };
  }),

  on(CryptoActions.setSorting, (state, { sortBy, sortOrder }): CryptoState => {
    // If clicking same column, toggle sort order
    const newSortOrder = state.sortBy === sortBy && state.sortOrder === 'desc' ? 'asc' : 'desc';

    return {
      ...state,
      sortBy,
      sortOrder: newSortOrder
    };
  }),

  on(CryptoActions.retryFailedRequest, (state): CryptoState => ({
    ...state,
    loading: true,
    error: null
  }))
);
