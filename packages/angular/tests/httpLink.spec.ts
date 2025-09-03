import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { InjectionToken, inject } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Apollo, ApolloOptions, InMemoryCache, gql, provideApollo, withApolloOptions } from '@apollo-orbit/angular';
import { HttpLinkFactory, withHttpLink } from '@apollo-orbit/angular/http';
import { HttpLink } from '@apollo/client';

const HTTP_OPTIONS: InjectionToken<HttpLink.Options> = new InjectionToken('http options');

const query = gql`query Books { books { id } }`;
const uri = 'http://localhost';

describe('HttpLink', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApollo(
          withApolloOptions((): ApolloOptions => {
            return {
              cache: new InMemoryCache(),
              link: inject(HttpLinkFactory).create(inject(HTTP_OPTIONS))
            };
          }),
          withHttpLink()
        )
      ]
    });
  });

  it('should make http request', waitForAsync(() => {
    const httpOptions: HttpLink.Options = {
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
      body: expect.stringMatching(/\{"operationName":"Books","variables":\{\},"extensions":\{"clientLibrary":\{"name":"@apollo\/client","version":"[^"]+"\}\},"query":"query Books \{\\n  books \{\\n    id\\n    __typename\\n  \}\\n\}"\}/)// eslint-disable-line
    });
    req.flush({ data: { books: [{ __typename: 'Book', id: 1 }] } });
    httpTestingController.verify();
  }));

  it('should make http request with get', waitForAsync(() => {
    const httpOptions: HttpLink.Options = {
      uri,
      useGETForQueries: true
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HTTP_OPTIONS, useValue: httpOptions }]
    });

    const httpTestingController = TestBed.inject(HttpTestingController);
    const apollo = TestBed.inject(Apollo);
    apollo.query({ query }).subscribe(result => expect(result.data).toEqual({ books: [{ __typename: 'Book', id: 1 }] }));
    const req = httpTestingController.expectOne(req => /http:\/\/localhost\?query=query%20Books%20%7B%0A%20%20books%20%7B%0A%20%20%20%20id%0A%20%20%20%20__typename%0A%20%20%7D%0A%7D&operationName=Books&variables=%7B%7D&extensions=%7B%22clientLibrary%22%3A%7B%22name%22%3A%22%40apollo%2Fclient%22%2C%22version%22%3A%22(.*?)%22%7D%7D/g.test(req.urlWithParams)); // eslint-disable-line max-len
    expect(req.request).toMatchObject({
      method: 'GET',
      body: null
    });
    req.flush({ data: { books: [{ __typename: 'Book', id: 1 }] } });
    httpTestingController.verify();
  }));

  it('should make http request with fetch options', waitForAsync(() => {
    const httpOptions: HttpLink.Options = {
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
    const httpOptions: HttpLink.Options = {
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
