import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppConfig } from './app-config';
import { AppConfigLoader } from './app-config-loader';

export const loadConfig = (appConfigLoader: AppConfigLoader) => (): Promise<void> => appConfigLoader.load();
export const configFactory = (appConfigLoader: AppConfigLoader): AppConfig => appConfigLoader.config;

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    AppConfigLoader,
    {
      provide: APP_INITIALIZER,
      useFactory: loadConfig,
      deps: [AppConfigLoader],
      multi: true
    },
    {
      provide: AppConfig,
      useFactory: configFactory,
      deps: [AppConfigLoader]
    }
  ]
})
export class ConfigModule { }
