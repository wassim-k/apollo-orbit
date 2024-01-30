import { provideHttpClient, withFetch } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { GraphQLModule } from './graphql/graphql.module';
import { LibraryModule } from './library/library.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    GraphQLModule,
    LibraryModule
  ],
  providers: [
    provideHttpClient(withFetch()),
    provideClientHydration(withHttpTransferCacheOptions({
      includePostRequests: true
    }))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
