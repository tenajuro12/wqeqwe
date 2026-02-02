import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { StoreModule } from '@ngrx/store';
import { HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { CryptoEffects } from './crypto.effects';
import { CryptoService } from '../services/crypto.service';
import * as CryptoActions from './crypto.actions';
import { server } from '../../mocks/server';
import { errorHandlers, mockAssets } from '../../mocks/handlers';
import { Action } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { describe, expect, test } from "@jest/globals";

describe('CryptoEffects Integration Tests with MSW', () => {
  let actions$: Observable<Action>;
  let effects: CryptoEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        StoreModule.forRoot({})
      ],
      providers: [
        CryptoEffects,
        CryptoService,
        provideMockActions(() => actions$)
      ]
    });

    effects = TestBed.inject(CryptoEffects);
  });

  // =========================
  // loadCryptoData$ Success
  // =========================
  describe('loadCryptoData$ Effect - Success', () => {
    it('should dispatch loadCryptoDataSuccess on successful data load', async () => {
      actions$ = of(CryptoActions.loadCryptoData());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));

      expect(action.type).toBe('[Crypto] Load Data Success');
      const successAction = action as ReturnType<typeof CryptoActions.loadCryptoDataSuccess>;
      expect(successAction.assets).toBeDefined();
      expect(successAction.assets.length).toBe(3);
      expect(successAction.assets[0].id).toBe('bitcoin');
    });
  });

  // =========================
  // loadCryptoData$ Errors
  // =========================
  describe('loadCryptoData$ Effect - Errors', () => {
    it('should dispatch loadCryptoDataFailure on 500 server error', async () => {
      server.use(errorHandlers.serverError);
      actions$ = of(CryptoActions.loadCryptoData());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));

      expect(action.type).toBe('[Crypto] Load Data Failure');
      const failureAction = action as ReturnType<typeof CryptoActions.loadCryptoDataFailure>;
      expect(failureAction.error).toBeDefined();
      expect(failureAction.error).toContain('Failed to load cryptocurrency data');
    });

    it('should dispatch loadCryptoDataFailure on 404 not found', async () => {
      server.use(errorHandlers.notFound);
      actions$ = of(CryptoActions.loadCryptoData());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));
      expect(action.type).toBe('[Crypto] Load Data Failure');
    });

    it('should dispatch loadCryptoDataFailure on network error', async () => {
      server.use(errorHandlers.networkError);
      actions$ = of(CryptoActions.loadCryptoData());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));
      expect(action.type).toBe('[Crypto] Load Data Failure');
    });

    it('should dispatch loadCryptoDataFailure on 429 rate limit', async () => {
      server.use(errorHandlers.rateLimit);
      actions$ = of(CryptoActions.loadCryptoData());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));
      expect(action.type).toBe('[Crypto] Load Data Failure');
    });
  });

  // =========================
  // retryFailedRequest$
  // =========================
  describe('retryFailedRequest$ Effect', () => {
    it('should retry and dispatch success', async () => {
      actions$ = of(CryptoActions.retryFailedRequest());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));
      expect(action.type).toBe('[Crypto] Load Data Success');
    });
  });


  describe('Edge Cases', () => {
    it('should handle empty data response', async () => {
      server.use(errorHandlers.emptyData);
      actions$ = of(CryptoActions.loadCryptoData());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));
      expect(action.type).toMatch(/\[Crypto\] Load Data (Success|Failure)/);

      if (action.type === '[Crypto] Load Data Success') {
        expect((action as ReturnType<typeof CryptoActions.loadCryptoDataSuccess>).assets.length).toBe(0);
      }
    });

    it('should handle malformed data response', async () => {
      server.use(errorHandlers.malformedData);
      actions$ = of(CryptoActions.loadCryptoData());

      const action = await firstValueFrom(effects.loadCryptoData$.pipe(take(1)));
      expect(action.type).toMatch(/\[Crypto\] Load Data (Success|Failure)/);
    });
  });
});
