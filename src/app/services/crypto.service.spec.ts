import { TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { CryptoService } from './crypto.service';
import { server } from '../../mocks/server';
import { errorHandlers, mockAssets } from '../../mocks/handlers';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, beforeEach } from "@jest/globals";

describe('CryptoService Integration Tests with MSW', () => {
  let service: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [CryptoService]
    });
    service = TestBed.inject(CryptoService);
  });

  // ✅ getCryptoAssets
  describe('getCryptoAssets', () => {
    it('should fetch crypto assets successfully', async () => {
      const assets = await firstValueFrom(service.getCryptoAssets());
      expect(Array.isArray(assets)).toBe(true);
      expect(assets.length).toBeGreaterThan(0);
      expect(assets[0]).toHaveProperty('id');
      expect(assets[0]).toHaveProperty('price');
    });

    it('should handle 500 Internal Server Error', async () => {
      server.use(errorHandlers.serverError);
      await expect(firstValueFrom(service.getCryptoAssets())).rejects.toMatchObject({ status: 500 });
    });

    it('should handle 503 Service Unavailable', async () => {
      server.use(errorHandlers.serviceUnavailable);
      await expect(firstValueFrom(service.getCryptoAssets())).rejects.toMatchObject({ status: 503 });
    });

    it('should handle 404 Not Found', async () => {
      server.use(errorHandlers.notFound);
      await expect(firstValueFrom(service.getCryptoAssets())).rejects.toMatchObject({ status: 404 });
    });

    it('should handle 429 Rate Limit', async () => {
      server.use(errorHandlers.rateLimit);
      await expect(firstValueFrom(service.getCryptoAssets())).rejects.toMatchObject({ status: 429 });
    });

    it('should handle empty response', async () => {
      server.use(errorHandlers.emptyData);
      const assets = await firstValueFrom(service.getCryptoAssets());
      expect(Array.isArray(assets)).toBe(true);
      expect(assets.length).toBe(0);
    });

    it('should handle network error', async () => {
      server.use(errorHandlers.networkError);
      await expect(firstValueFrom(service.getCryptoAssets())).rejects.toBeTruthy();
    });
  });

  // ✅ getPriceUpdates
  describe('getPriceUpdates', () => {
    it('should fetch price updates', async () => {
      const updates = await firstValueFrom(service.getPriceUpdates());
      expect(Array.isArray(updates)).toBe(true);
      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0]).toHaveProperty('id');
      expect(updates[0]).toHaveProperty('price');
      expect(updates[0]).toHaveProperty('change24h');
    });
  });

  // ✅ searchAssets
  describe('searchAssets', () => {
    it('should return filtered results by name or symbol', async () => {
      const results = await firstValueFrom(service.searchAssets('bitcoin'));
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('bitcoin');
    });

    it('should return empty array if no matches', async () => {
      const results = await firstValueFrom(service.searchAssets('nonexistentcrypto'));
      expect(results.length).toBe(0);
    });
  });

  // ✅ getCryptoChart
  describe('getCryptoChart', () => {
    it('should fetch chart data successfully', async () => {
      const chart = await firstValueFrom(service.getCryptoChart('bitcoin', 7));
      expect(chart).toHaveProperty('prices');
      expect(chart).toHaveProperty('labels');
      expect(chart.prices.length).toBe(7);
      expect(chart.labels.length).toBe(7);
    });
  });

  // ✅ getMultipleCharts
  describe('getMultipleCharts', () => {
    it('should fetch multiple chart data successfully', async () => {
      const charts = await firstValueFrom(service.getMultipleCharts(['bitcoin','ethereum'], 7));
      expect(charts["bitcoin"]).toBeDefined();
      expect(charts["ethereum"]).toBeDefined();
      expect(charts["bitcoin"].prices.length).toBe(7);
      expect(charts["ethereum"].prices.length).toBe(7);
    });
  });
});
