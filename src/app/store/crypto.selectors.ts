import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CryptoState } from './crypto.actions';

export const selectCryptoState = createFeatureSelector<CryptoState>('crypto');

export const selectAllAssets = createSelector(
  selectCryptoState,
  (state) => state.assets
);

export const selectLoading = createSelector(
  selectCryptoState,
  (state) => state.loading
);

export const selectError = createSelector(
  selectCryptoState,
  (state) => state.error
);

export const selectSearchQuery = createSelector(
  selectCryptoState,
  (state) => state.searchQuery
);

export const selectSelectedAssets = createSelector(
  selectCryptoState,
  (state) => state.selectedAssets
);

export const selectSorting = createSelector(
  selectCryptoState,
  (state) => ({ sortBy: state.sortBy, sortOrder: state.sortOrder })
);

export const selectFilteredAndSortedAssets = createSelector(
  selectAllAssets,
  selectSearchQuery,
  selectSorting,
  (assets, searchQuery, { sortBy, sortOrder }) => {
    let filtered = assets;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = assets.filter(asset =>
        asset.name.toLowerCase().includes(query) ||
        asset.symbol.toLowerCase().includes(query)
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  }
);

export const selectSelectedAssetsDetails = createSelector(
  selectAllAssets,
  selectSelectedAssets,
  (assets, selectedIds) => {
    return assets.filter(asset => selectedIds.includes(asset.id));
  }
);

export const selectPortfolioStats = createSelector(
  selectSelectedAssetsDetails,
  (selectedAssets) => {
    if (selectedAssets.length === 0) {
      return null;
    }
    
    const totalValue = selectedAssets.reduce((sum, asset) => sum + asset.marketCap, 0);
    const avgChange = selectedAssets.reduce((sum, asset) => sum + asset.change24h, 0) / selectedAssets.length;
    
    return {
      totalAssets: selectedAssets.length,
      totalValue,
      avgChange,
      topPerformer: selectedAssets.reduce((top, asset) => 
        asset.change24h > top.change24h ? asset : top
      ),
      worstPerformer: selectedAssets.reduce((worst, asset) => 
        asset.change24h < worst.change24h ? asset : worst
      )
    };
  }
);
