import { inject } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { APOLLO_MULTI_ROOT, Apollo, InMemoryCache, provideApollo, provideApolloInstance, withApolloOptions } from '@apollo-orbit/angular';
import { ApolloLink } from '@apollo/client/link';

describe('Providers', () => {
  describe('guard', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideApollo(withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty() })),
          provideRouter([
            {
              path: '',
              children: []
            },
            {
              path: 'child',
              providers: [provideApollo(withApolloOptions({ cache: new InMemoryCache(), link: ApolloLink.empty() }))],
              children: []
            }
          ])
        ]
      });
    });

    it('should throw if provideApollo was called more than once', waitForAsync(async () => {
      const harness = await RouterTestingHarness.create();
      await expect(harness.navigateByUrl('/child')).rejects.toThrow(/should only be called once/);
    }));

    it('should not throw if provideApollo was called more than once and APOLLO_MULTI_ROOT was supplied', waitForAsync(async () => {
      TestBed.overrideProvider(APOLLO_MULTI_ROOT, { useValue: true });
      const harness = await RouterTestingHarness.create();
      await expect(harness.navigateByUrl('/child')).resolves.not.toThrow();
    }));
  });

  it('should accept options object as a parameter', () => {
    const cache = new InMemoryCache();
    TestBed.configureTestingModule({
      providers: [
        provideApollo(withApolloOptions({ cache, link: ApolloLink.empty() }))
      ]
    });

    const apollo = TestBed.inject(Apollo);
    expect(apollo.cache).toEqual(cache);
  });

  it('should accept options function as a parameter', () => {
    const cache = new InMemoryCache();
    TestBed.configureTestingModule({
      providers: [
        { provide: InMemoryCache, useValue: cache },
        provideApollo(withApolloOptions(() => ({ cache: inject(InMemoryCache), link: ApolloLink.empty() })))
      ]
    });

    const apollo = TestBed.inject(Apollo);
    expect(apollo.cache).toEqual(cache);
  });

  it('should support provideApolloInstance', () => {
    class ApolloMulti extends Apollo { }
    const cache1 = new InMemoryCache();
    const cache2 = new InMemoryCache();
    TestBed.configureTestingModule({
      providers: [
        provideApollo(withApolloOptions({ cache: cache1, link: ApolloLink.empty() })),
        provideApolloInstance(ApolloMulti, { cache: cache2, link: ApolloLink.empty() })
      ]
    });

    expect(TestBed.inject(Apollo).cache).toBe(cache1);
    expect(TestBed.inject(ApolloMulti).cache).toBe(cache2);
  });
});
