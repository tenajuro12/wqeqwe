import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import * as CryptoActions from '../../store/crypto.actions';
import * as CryptoSelectors from '../../store/crypto.selectors';
import { CryptoAsset } from '../../store/crypto.actions';
import { CryptoChartComponent } from '../crypto-chart/crypto-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CryptoChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  filteredAssets$ = this.store.select(CryptoSelectors.selectFilteredAndSortedAssets);
  loading$ = this.store.select(CryptoSelectors.selectLoading);
  error$ = this.store.select(CryptoSelectors.selectError);
  searchQuery$ = this.store.select(CryptoSelectors.selectSearchQuery);
  selectedAssets$ = this.store.select(CryptoSelectors.selectSelectedAssets);
  portfolioStats$ = this.store.select(CryptoSelectors.selectPortfolioStats);
  sorting$ = this.store.select(CryptoSelectors.selectSorting);

  viewModel$ = combineLatest([
    this.filteredAssets$,
    this.loading$,
    this.error$,
    this.searchQuery$,
    this.selectedAssets$,
    this.portfolioStats$,
    this.sorting$
  ]).pipe(
    map(([assets, loading, error, searchQuery, selectedAssets, portfolioStats, sorting]) => ({
      assets,
      loading,
      error,
      searchQuery,
      selectedAssets,
      portfolioStats,
      sorting,
      hasData: assets.length > 0,
      isEmpty: !loading && assets.length === 0 && !error
    }))
  );

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(CryptoActions.loadCryptoData());
  }

  onSearchChange(query: string): void {
    this.store.dispatch(CryptoActions.setSearchQuery({ query }));
  }

  onToggleAsset(assetId: string): void {
    this.store.dispatch(CryptoActions.toggleAssetSelection({ assetId }));
  }

  onSort(sortBy: 'price' | 'change24h' | 'volume24h' | 'marketCap'): void {
    this.store.dispatch(CryptoActions.setSorting({
      sortBy,
      sortOrder: 'desc'
    }));
  }

  onRetry(): void {
    this.store.dispatch(CryptoActions.retryFailedRequest());
  }

  isAssetSelected(assetId: string, selectedAssets: string[]): boolean {
    return selectedAssets.includes(assetId);
  }

  trackByAssetId(index: number, asset: CryptoAsset): string {
    return asset.id;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  formatLargeNumber(num: number): string {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    else if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  }

  formatChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'positive' : 'negative';
  }

  getAssetName(assetId: string, assets: CryptoAsset[]): string {
    const asset = assets.find(a => a.id === assetId);
    return asset ? asset.name : assetId;
  }
}
