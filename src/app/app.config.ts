import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { cryptoReducer } from './store/crypto.reducer';
import { CryptoEffects } from './store/crypto.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(
      StoreModule.forRoot({ crypto: cryptoReducer }),
      EffectsModule.forRoot([CryptoEffects]),
      StoreDevtoolsModule.instrument({
        maxAge: 25,
        logOnly: false,
        autoPause: true,
        trace: false,
        traceLimit: 75
      })
    )
  ]
};
