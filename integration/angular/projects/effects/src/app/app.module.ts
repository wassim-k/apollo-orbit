import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BooksModule } from './books/books.module';
import { ConfigModule } from './config/config.module';
import { GraphQLModule } from './graphql/graphql.module';
import { ThemeTogglerComponent } from './theme-toggler/theme-toggler.component';

@NgModule({
  declarations: [
    AppComponent,
    ThemeTogglerComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BooksModule,
    ConfigModule,
    GraphQLModule,
    HttpClientModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
