import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { AppConfig } from './app-config';
import { AppConfigLoader } from './app-config-loader';

export function provideConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    AppConfigLoader,
    provideAppInitializer(() => inject(AppConfigLoader).load()),
    {
      provide: AppConfig,
      useFactory: () => inject(AppConfigLoader).config
    }
  ]);
}
