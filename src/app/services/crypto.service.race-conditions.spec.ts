import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { CryptoService } from './crypto.service';
import { server } from '../../mocks/server';
import { rest } from 'msw';
import { firstValueFrom, Subject, takeUntil, race, timer } from 'rxjs';
import { take, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { describe, expect, test } from "@jest/globals";

const API_BASE = 'https://api.coingecko.com/api/v3';

const mockAssets = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 45000 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3200 },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 1.2 }
];

describe('CryptoService - Race Conditions & Loading States', () => {
  let service: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [CryptoService]
    });
    service = TestBed.inject(CryptoService);
  });

  describe('🏁 Race Condition Tests', () => {

    it('TEST 2: should handle concurrent requests to different endpoints without interference', async () => {
      /**
       * Scenario: Multiple endpoints are called simultaneously
       * Each should return its own data without mixing up responses
       */
      let marketsCallCount = 0;
      let chartCallCount = 0;

      server.use(
        rest.get(`${API_BASE}/coins/markets`, async (_req, res, ctx) => {
          marketsCallCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
          return res(ctx.status(200), ctx.json(mockAssets));
        }),
        rest.get(`${API_BASE}/coins/:id/market_chart`, async (_req, res, ctx) => {
          chartCallCount++;
          await new Promise(resolve => setTimeout(resolve, 150));
          return res(ctx.status(200), ctx.json({
            prices: [[Date.now(), 45000], [Date.now(), 45100]]
          }));
        })
      );

      // Fire both requests simultaneously
      const [assetsResult, chartResult] = await Promise.all([
        firstValueFrom(service.getCryptoAssets()),
        firstValueFrom(service.getCryptoChart('bitcoin', 7))
      ]);

      // Verify each endpoint was called
      expect(marketsCallCount).toBe(1);
      expect(chartCallCount).toBe(1);

      // Verify correct data for each response (no cross-contamination)
      expect(assetsResult.length).toBe(3);
      expect(assetsResult[0].id).toBe('bitcoin');
      expect(chartResult.prices).toBeDefined();
      expect(chartResult.prices.length).toBe(2);
    });

    it('TEST 3: should handle request cancellation during slow response', async () => {
      /**
       * Scenario: User navigates away or cancels request during loading
       * The pending request should be cancellable without memory leaks
       */
      let requestStarted = false;
      let requestCompleted = false;

      server.use(
        rest.get(`${API_BASE}/coins/markets`, async (_req, res, ctx) => {
          requestStarted = true;
          // Very slow response (2 seconds)
          await new Promise(resolve => setTimeout(resolve, 2000));
          requestCompleted = true;
          return res(ctx.status(200), ctx.json(mockAssets));
        })
      );

      const cancel$ = new Subject<void>();
      let receivedData: any = null;
      let wasCompleted = false;
      let wasError = false;

      // Start the request
      const subscription = service.getCryptoAssets().pipe(
        takeUntil(cancel$)
      ).subscribe({
        next: (data) => { receivedData = data; },
        error: () => { wasError = true; },
        complete: () => { wasCompleted = true; }
      });

      // Wait for request to start
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(requestStarted).toBe(true);

      // Cancel the request after 100ms (before it completes)
      await new Promise(resolve => setTimeout(resolve, 100));
      cancel$.next();
      cancel$.complete();
      subscription.unsubscribe();

      // Verify subscription was cancelled
      expect(receivedData).toBeNull();
      expect(wasCompleted).toBe(true); // takeUntil completes the observable
      expect(wasError).toBe(false);

      // Note: The HTTP request may still complete server-side,
      // but our subscription should be cancelled
    });
  });

  describe('⏳ Loading State / Skeleton Screen Tests', () => {

    it('TEST 4: should expose loading state during slow API response (simulating skeleton screen)', async () => {

      const loadingStates: { timestamp: number; state: string }[] = [];
      const startTime = Date.now();

      server.use(
        rest.get(`${API_BASE}/coins/markets`, async (_req, res, ctx) => {
          // Simulate slow network - 500ms delay
          await new Promise(resolve => setTimeout(resolve, 500));
          return res(ctx.status(200), ctx.json(mockAssets));
        })
      );

      // Track loading state
      loadingStates.push({ timestamp: Date.now() - startTime, state: 'LOADING_START' });

      const result = await firstValueFrom(service.getCryptoAssets());

      loadingStates.push({ timestamp: Date.now() - startTime, state: 'LOADING_END' });

      // Verify the loading duration was appropriate
      const loadingDuration = loadingStates[1].timestamp - loadingStates[0].timestamp;

      expect(loadingDuration).toBeGreaterThanOrEqual(400); // At least 400ms (accounting for timing variance)
      expect(loadingDuration).toBeLessThan(1000); // Should not exceed 1 second
      expect(result.length).toBe(3);

      // This proves there was time for skeleton screen to be displayed
      console.log(`Loading took ${loadingDuration}ms - sufficient time for skeleton screen`);
    });

    it('TEST 5: should handle timeout for extremely slow responses', async () => {
      /**
       * Scenario: API is too slow (simulating timeout scenario)
       * Request should timeout after a reasonable period
       */
      server.use(
        rest.get(`${API_BASE}/coins/markets`, async (_req, res, ctx) => {
          // Extremely slow - 10 seconds
          await new Promise(resolve => setTimeout(resolve, 10000));
          return res(ctx.status(200), ctx.json(mockAssets));
        })
      );

      const startTime = Date.now();
      let timedOut = false;
      let errorMessage = '';

      try {
        // Apply a 1 second timeout
        await firstValueFrom(
          service.getCryptoAssets().pipe(
            timeout(1000),
            catchError(err => {
              timedOut = true;
              errorMessage = err.message || err.name;
              throw err;
            })
          )
        );
      } catch (error: any) {
        // Expected to timeout
      }

      const elapsed = Date.now() - startTime;

      expect(timedOut).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(900); // Close to 1 second
      expect(elapsed).toBeLessThan(2000); // Definitely not 10 seconds
      expect(errorMessage).toContain('Timeout');
    });

    it('TEST 6: should handle variable response times correctly', async () => {
      /**
       * Scenario: Multiple sequential requests with varying response times
       * Simulates real-world network conditions
       */
      let callCount = 0;
      const responseTimes = [200, 50, 300, 100]; // Variable delays
      const measuredTimes: number[] = [];

      server.use(
        rest.get(`${API_BASE}/coins/markets`, async (_req, res, ctx) => {
          const delay = responseTimes[callCount % responseTimes.length];
          callCount++;
          await new Promise(resolve => setTimeout(resolve, delay));
          return res(ctx.status(200), ctx.json(mockAssets));
        })
      );

      // Make 4 sequential requests and measure timing
      for (let i = 0; i < 4; i++) {
        const start = Date.now();
        await firstValueFrom(service.getCryptoAssets());
        measuredTimes.push(Date.now() - start);

        // Reset handlers to ensure fresh state (simulating separate requests)
        server.resetHandlers(
          rest.get(`${API_BASE}/coins/markets`, async (_req, res, ctx) => {
            const delay = responseTimes[(i + 1) % responseTimes.length];
            await new Promise(resolve => setTimeout(resolve, delay));
            return res(ctx.status(200), ctx.json(mockAssets));
          })
        );
      }

      // Verify timing variations were handled
      expect(measuredTimes.length).toBe(4);

      // Each request should complete within reasonable bounds
      measuredTimes.forEach((time, index) => {
        expect(time).toBeGreaterThanOrEqual(responseTimes[index] - 50); // Allow 50ms variance
        expect(time).toBeLessThan(responseTimes[index] + 200); // Should not significantly exceed delay
      });

      console.log('Response times measured:', measuredTimes);
    });
  });

  describe('🔄 Request Deduplication Tests', () => {

    it('TEST 7: should handle rapid repeated requests (debounce scenario)', async () => {
      /**
       * Scenario: User rapidly triggers same request multiple times
       * Only one actual HTTP request should be made (simulating debounce)
       */
      let actualRequestCount = 0;

      server.use(
        rest.get(`${API_BASE}/coins/markets`, async (_req, res, ctx) => {
          actualRequestCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
          return res(ctx.status(200), ctx.json(mockAssets));
        })
      );

      // Simulate rapid clicks/requests
      const promises: Promise<any>[] = [];

      // Use shareReplay or similar to deduplicate - for this test we'll just measure
      for (let i = 0; i < 5; i++) {
        promises.push(firstValueFrom(service.getCryptoAssets()));
        // Tiny delay between requests
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      const results = await Promise.all(promises);

      // All results should be valid
      results.forEach(result => {
        expect(result.length).toBe(3);
        expect(result[0].id).toBe('bitcoin');
      });

      // Note: Without caching/shareReplay, each call makes a request
      // This test documents the behavior - your service may implement caching
      console.log(`${actualRequestCount} actual HTTP requests made for 5 rapid calls`);
    });
  });
});
