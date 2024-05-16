import { inject } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { APOLLO_MULTI_ROOT, Apollo, InMemoryCache, provideApolloInstance, provideApolloOrbit, withApolloOptions } from '@apollo-orbit/angular/core';

describe('Providers', () => {
  describe('guard', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideApolloOrbit(withApolloOptions({ cache: new InMemoryCache() })),
          provideRouter([
            {
              path: '',
              children: []
            },
            {
              path: 'child',
              providers: [provideApolloOrbit(withApolloOptions({ cache: new InMemoryCache() }))],
              children: []
            }
          ])
        ]
      });
    });

    it('should throw if provideApolloOrbit was called more than once', waitForAsync(async () => {
      const harness = await RouterTestingHarness.create();
      await expect(harness.navigateByUrl('/child')).rejects.toThrow(/has been called more than once/);
    }));

    it('should not throw if provideApolloOrbit was called more than once and APOLLO_MULTI_ROOT was supplied', waitForAsync(async () => {
      TestBed.overrideProvider(APOLLO_MULTI_ROOT, { useValue: true });
      const harness = await RouterTestingHarness.create();
      await expect(harness.navigateByUrl('/child')).resolves.not.toThrow();
    }));
  });

  it('should accept options object as a parameter', () => {
    const cache = new InMemoryCache();
    TestBed.configureTestingModule({
      providers: [
        provideApolloOrbit(withApolloOptions({ cache }))
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
        provideApolloOrbit(withApolloOptions(() => ({ cache: inject(InMemoryCache) })))
      ]
    });

    const apollo = TestBed.inject(Apollo);
    expect(apollo.cache).toEqual(cache);
  });

  it('should support provideApolloInstance', async () => {
    class ApolloMulti extends Apollo { }
    const cache1 = new InMemoryCache();
    const cache2 = new InMemoryCache();
    TestBed.configureTestingModule({
      providers: [
        provideApolloOrbit(withApolloOptions({ cache: cache1 })),
        provideApolloInstance(ApolloMulti, { cache: cache2 })
      ]
    });

    expect(TestBed.inject(Apollo).cache).toBe(cache1);
    expect(TestBed.inject(ApolloMulti).cache).toBe(cache2);
  });
});
