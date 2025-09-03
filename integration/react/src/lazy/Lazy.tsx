import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { useQuery } from '@apollo/client/react';
import { LAZY_QUERY } from '../graphql';
import { lazyState } from './states/lazy';

export default function Lazy() {
  const result = useQuery(LAZY_QUERY);
  return (
    <ApolloOrbitProvider states={[lazyState]}>
      {result.loading && <div>Loading lazy...</div>}
      {result.data && <div>{result.data.lazy ? 'Lazy loaded' : ''}</div>}
    </ApolloOrbitProvider>
  );
}
