import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { useQuery } from '@apollo/client';
import { LazyDocument } from '../graphql';
import { lazyState } from './states/lazy';

export default function Lazy() {
  const result = useQuery(LazyDocument);
  return (
    <ApolloOrbitProvider states={[lazyState]}>
      {result.loading && <div>Loading lazy...</div>}
      {result.data && <div>{result.data.lazy}</div>}
    </ApolloOrbitProvider>
  );
}
