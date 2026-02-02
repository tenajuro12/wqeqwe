import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CryptoAsset } from '../store/crypto.actions';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private readonly API_BASE = 'https://api.coingecko.com/api/v3';

  constructor(private http: HttpClient) {}

  getCryptoAssets(): Observable<CryptoAsset[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`
    ).pipe(
      map(coins => coins.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        lastUpdated: Date.now(),
        image: coin.image
      }))),
      catchError(error => {
        console.error('Error fetching crypto data:', error);
        throw error;
      })
    );
  }

  getPriceUpdates(): Observable<Partial<CryptoAsset>[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`
    ).pipe(
      map(coins => coins.map(coin => ({
        id: coin.id,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h || 0,
        lastUpdated: Date.now()
      }))),
      catchError(error => {
        console.error('Error fetching price updates:', error);
        throw error;
      })
    );
  }

  searchAssets(query: string): Observable<CryptoAsset[]> {
    return this.http.get<any[]>(
      `${this.API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
    ).pipe(
      map(coins => {
        const lowerQuery = query.toLowerCase();
        return coins
          .filter(coin =>
            coin.name.toLowerCase().includes(lowerQuery) ||
            coin.symbol.toLowerCase().includes(lowerQuery)
          )
          .slice(0, 10)
          .map(coin => ({
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            price: coin.current_price,
            change24h: coin.price_change_percentage_24h || 0,
            volume24h: coin.total_volume,
            marketCap: coin.market_cap,
            lastUpdated: Date.now(),
            image: coin.image
          }));
      })
    );
  }

  getCryptoChart(coinId: string, days: number = 7): Observable<{prices: number[], labels: string[]}> {
    return this.http.get<any>(
      `${this.API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
    ).pipe(
      map(data => {
        const prices = data.prices.map((p: any[]) => p[1]);
        const labels = data.prices.map((p: any[]) => {
          const date = new Date(p[0]);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        return { prices, labels };
      })
    );
  }

  getMultipleCharts(coinIds: string[], days: number = 7): Observable<{[key: string]: {prices: number[], labels: string[]}}> {
    const requests = coinIds.map(id =>
      this.getCryptoChart(id, days).pipe(
        map(data => ({ [id]: data }))
      )
    );

    return forkJoin(requests).pipe(
      map(results => Object.assign({}, ...results))
    );
  }
}
