import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { 
  catchError, 
  map, 
  switchMap, 
  withLatestFrom,
  exhaustMap,
  delay,
  retryWhen,
  scan,
  tap
} from 'rxjs/operators';
import { of, interval, timer } from 'rxjs';
import * as CryptoActions from './crypto.actions';
import { CryptoService } from '../services/crypto.service';
import { selectSearchQuery } from './crypto.selectors';

@Injectable()
export class CryptoEffects {
  
  loadCryptoData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CryptoActions.loadCryptoData, CryptoActions.retryFailedRequest),
      exhaustMap(() =>
        this.cryptoService.getCryptoAssets().pipe(
          retryWhen(errors =>
            errors.pipe(
              scan((retryCount, error) => {
                if (retryCount >= 3) {
                  throw error;
                }
                console.log(`Retry attempt ${retryCount + 1} after error:`, error);
                return retryCount + 1;
              }, 0),
              delay(1000)
            )
          ),
          map(assets => CryptoActions.loadCryptoDataSuccess({ assets })),
          catchError(error => {
            console.error('Failed to load crypto data:', error);
            return of(CryptoActions.loadCryptoDataFailure({ 
              error: 'Failed to load cryptocurrency data. Please try again.' 
            }));
          })
        )
      )
    )
  );

  startPriceUpdates$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CryptoActions.loadCryptoDataSuccess),
      switchMap(() =>
        interval(3000).pipe(
          switchMap(() => 
            this.cryptoService.getPriceUpdates().pipe(
              map(updates => CryptoActions.updateCryptoPrices({ updates })),
              catchError(error => {
                console.warn('Price update failed:', error);
                return of({ type: '[Crypto] Price Update Failed' });
              })
            )
          )
        )
      )
    )
  );

  searchCrypto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CryptoActions.setSearchQuery),
      switchMap(({ query }) =>
        timer(300).pipe(
          withLatestFrom(this.store.select(selectSearchQuery)),
          switchMap(([_, currentQuery]) => {
            if (!currentQuery || currentQuery.length < 2) {
              return of({ type: '[Crypto] Search Too Short' });
            }
            
            return this.cryptoService.searchAssets(currentQuery).pipe(
              map(results => ({ 
                type: '[Crypto] Search Results',
                payload: results 
              })),
              catchError(() => of({ type: '[Crypto] Search Failed' }))
            );
          })
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private cryptoService: CryptoService,
    private store: Store
  ) {}
}
