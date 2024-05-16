import { BatchHttpLinkFactory } from './batchHttpLinkFactory';
import { ApolloOrbitFeature } from './types';

export function withBatchHttpLink(): ApolloOrbitFeature {
  return {
    kind: 'APOLLO_ORBIT_BATCH_HTTP_LINK',
    providers: [BatchHttpLinkFactory]
  };
}
