import * as selectors from './crypto.selectors';
import { CryptoAsset, CryptoState } from './crypto.actions';
import { describe, expect, test } from "@jest/globals";

describe('Crypto Selectors', () => {

  const mockAssets: CryptoAsset[] = [
    {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 45000,
      marketCap: 900000000000,
      change24h: 2,
      volume24h: 45000000000,
      lastUpdated: 0
    },
    {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3200,
      marketCap: 400000000000,
      change24h: -1.2,
      volume24h: 30000000000,
      lastUpdated: 0
    },
    {
      id: 'cardano',
      symbol: 'ADA',
      name: 'Cardano',
      price: 1.2,
      marketCap: 50000000000,
      change24h: 0.5,
      volume24h: 5000000000,
      lastUpdated: 0
    }
  ];

  const state: { crypto: CryptoState } = {
    crypto: {
      assets: mockAssets,
      loading: false,
      error: null,
      searchQuery: '',
      selectedAssets: ['bitcoin', 'cardano'],
      sortBy: 'price',
      sortOrder: 'desc'
    }
  };

  it('selectCryptoState should return crypto slice', () => {
    const result = selectors.selectCryptoState.projector(state.crypto);
    expect(result).toEqual(state.crypto);
  });

  it('selectAllAssets should return all assets', () => {
    const result = selectors.selectAllAssets.projector(state.crypto);
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('bitcoin');
  });

  it('selectLoading should return loading state', () => {
    const result = selectors.selectLoading.projector(state.crypto);
    expect(result).toBe(false);
  });

  it('selectError should return error state', () => {
    const result = selectors.selectError.projector(state.crypto);
    expect(result).toBeNull();
  });

  it('selectSearchQuery should return search query', () => {
    const result = selectors.selectSearchQuery.projector(state.crypto);
    expect(result).toBe('');
  });

  it('selectSelectedAssets should return selected asset IDs', () => {
    const result = selectors.selectSelectedAssets.projector(state.crypto);
    expect(result).toEqual(['bitcoin', 'cardano']);
  });

  it('selectSorting should return sortBy and sortOrder', () => {
    const result = selectors.selectSorting.projector(state.crypto);
    expect(result).toEqual({ sortBy: 'price', sortOrder: 'desc' });
  });

  it('selectSelectedAssetsDetails should return full asset objects for selected IDs', () => {
    const result = selectors.selectSelectedAssetsDetails.projector(mockAssets, ['bitcoin', 'cardano']);
    expect(result.length).toBe(2);
    expect(result.map(a => a.id)).toEqual(['bitcoin', 'cardano']);
  });

  it('selectPortfolioStats should compute stats correctly', () => {
    const selectedAssets = selectors.selectSelectedAssetsDetails.projector(mockAssets, ['bitcoin', 'cardano']);
    const stats = selectors.selectPortfolioStats.projector(selectedAssets);

    expect(stats).not.toBeNull();
    if (stats) {
      expect(stats.totalAssets).toBe(2);
      expect(stats.totalValue).toBe(950_000_000_000); // 900B + 50B
      expect(stats.avgChange).toBeCloseTo((2 + 0.5) / 2); // 1.25
      expect(stats.topPerformer.id).toBe('bitcoin');
      expect(stats.worstPerformer.id).toBe('cardano');
    }
  });

  it('selectPortfolioStats should return null if no selected assets', () => {
    const stats = selectors.selectPortfolioStats.projector([]);
    expect(stats).toBeNull();
  });

});
