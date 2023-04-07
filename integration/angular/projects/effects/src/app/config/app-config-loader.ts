import { HttpHeaders, HttpRequest, HttpResponse, HttpXhrBackend } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppConfig } from './app-config';

// We're using the primitive HttpXhrBackend service instead of HttpClient because it does not inject http interceptors
// some interceptors may depend on AppConfig, thus attempting to inject the config before it's loaded and throwing an error in the process
@Injectable()
export class AppConfigLoader {
  private _config: AppConfig | undefined;

  public constructor(
    private readonly httpClient: HttpXhrBackend
  ) { }

  public get config(): AppConfig {
    if (!this._config) throw new Error('Config is not loaded');
    return this._config;
  }

  public async load(): Promise<void> {
    const request = this.createJsonRequest<AppConfig>(`${window.location.origin}/app-config.json`);
    this._config = await lastValueFrom(this.httpClient.handle(request).pipe(
      filter((event): event is HttpResponse<AppConfig> => event instanceof HttpResponse),
      map((response: HttpResponse<AppConfig>) => response.body as AppConfig)
    ));
  }

  private createJsonRequest<T>(url: string): HttpRequest<T> {
    return new HttpRequest<T>('GET', url, { headers: new HttpHeaders({ 'content-type': 'application/json' }) });
  }
}
