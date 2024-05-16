import { HttpLinkFactory } from './httpLinkFactory';
import { ApolloOrbitFeature } from './types';

export function withHttpLink(): ApolloOrbitFeature {
  return {
    kind: 'APOLLO_ORBIT_HTTP_LINK',
    providers: [HttpLinkFactory]
  };
}
