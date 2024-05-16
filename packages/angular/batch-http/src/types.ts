import { Provider } from '@angular/core';

export interface ApolloOrbitFeature {
  kind: `APOLLO_ORBIT_${string}`;
  providers: Array<Provider>;
}
