import { provideHttpClient, withFetch } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigModule } from './config/config.module';
import { GraphQLModule } from './graphql/graphql.module';
import { LibraryModule } from './library/library.module';
import { ThemeComponent } from './theme/theme.component';

@NgModule({
  declarations: [
    AppComponent,
    ThemeComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    ConfigModule,
    GraphQLModule,
    LibraryModule
  ],
  providers: [
    provideHttpClient(withFetch())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
