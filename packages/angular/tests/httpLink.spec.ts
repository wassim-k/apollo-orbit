import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InjectionToken } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Apollo, ApolloOptions, ApolloOrbitModule, APOLLO_OPTIONS, gql, InMemoryCache } from '@apollo-orbit/angular';
import { HttpLinkFactory, HttpLinkModule } from '@apollo-orbit/angular/http';
import { HttpOptions } from '@apollo/client/core';
import 'whatwg-fetch';

const HTTP_OPTIONS: InjectionToken<HttpOptions> = new InjectionToken('http options');

function apolloOptionsFactory(httpLinkFactory: HttpLinkFactory, httpOptions: HttpOptions): ApolloOptions {
  return {
    cache: new InMemoryCache(),
    link: httpLinkFactory.create(httpOptions)
  };
}

const query = gql`query Books { books { id } }`;
const uri = 'http://localhost';

describe('HttpLink', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ApolloOrbitModule.forRoot(),
        HttpClientTestingModule,
        HttpLinkModule
      ],
      providers: [
        { provide: APOLLO_OPTIONS, useFactory: apolloOptionsFactory, deps: [HttpLinkFactory, HTTP_OPTIONS] }
      ]
    });
  });

  it('should make http request', waitForAsync(() => {
    const httpOptions: HttpOptions = {
      uri
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HTTP_OPTIONS, useValue: httpOptions }]
    });

    const httpTestingController = TestBed.inject(HttpTestingController);
    const apollo = TestBed.inject(Apollo);
    apollo.query({ query }).subscribe(result => expect(result.data).toEqual({ books: [{ __typename: 'Book', id: 1 }] }));
    const req = httpTestingController.expectOne(uri);
    expect(req.request).toMatchObject({
      method: 'POST',
      body: '{"operationName":"Books","variables":{},"query":"query Books {\\n  books {\\n    id\\n    __typename\\n  }\\n}"}'
    });
    req.flush({ data: { books: [{ __typename: 'Book', id: 1 }] } });
    httpTestingController.verify();
  }));

  it('should make http request with get', waitForAsync(() => {
    const httpOptions: HttpOptions = {
      uri,
      useGETForQueries: true
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HTTP_OPTIONS, useValue: httpOptions }]
    });

    const httpTestingController = TestBed.inject(HttpTestingController);
    const apollo = TestBed.inject(Apollo);
    apollo.query({ query }).subscribe(result => expect(result.data).toEqual({ books: [{ __typename: 'Book', id: 1 }] }));
    const req = httpTestingController.expectOne('http://localhost?query=query%20Books%20%7B%0A%20%20books%20%7B%0A%20%20%20%20id%0A%20%20%20%20__typename%0A%20%20%7D%0A%7D&operationName=Books&variables=%7B%7D');
    expect(req.request).toMatchObject({
      method: 'GET',
      body: null
    });
    req.flush({ data: { books: [{ __typename: 'Book', id: 1 }] } });
    httpTestingController.verify();
  }));

  it('should make http request with fetch options', waitForAsync(() => {
    const httpOptions: HttpOptions = {
      uri,
      fetchOptions: {
        credentials: 'include'
      }
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HTTP_OPTIONS, useValue: httpOptions }]
    });

    const httpTestingController = TestBed.inject(HttpTestingController);
    const apollo = TestBed.inject(Apollo);
    apollo.query({ query }).subscribe(result => expect(result.data).toEqual([{ id: 1 }]));
    const req = httpTestingController.expectOne(uri);
    expect(req.request.withCredentials).toBe(true);
    httpTestingController.verify();
  }));

  it('should handle invalid http request', waitForAsync(() => {
    const httpOptions: HttpOptions = {
      uri
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HTTP_OPTIONS, useValue: httpOptions }]
    });

    const httpTestingController = TestBed.inject(HttpTestingController);
    const apollo = TestBed.inject(Apollo);
    apollo.query({ query }).subscribe({
      error: error => expect(error.message).toEqual('Failed to fetch')
    });
    const req = httpTestingController.expectOne(uri);
    req.error(new ProgressEvent('Network Error'));
    httpTestingController.verify();
  }));
});
