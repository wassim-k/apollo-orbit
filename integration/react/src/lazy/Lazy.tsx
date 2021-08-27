import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { Query } from '@apollo-orbit/react/components';
import React from 'react';
import { lazyState } from './states/lazy';
import { LazyDocument } from './states/lazy/gql/lazy';

export default function Lazy() {
    return (
        <ApolloOrbitProvider states={[lazyState]}>
            <Query query={LazyDocument}>
                {result => <>
                    {result.loading && <div>Loading lazy...</div>}
                    {result.data && <div>{result.data.lazy}</div>}
                </>}
            </Query>
        </ApolloOrbitProvider>
    );
}
