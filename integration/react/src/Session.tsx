import { useMutation, useQuery } from '@apollo-orbit/react';
import React from 'react';
import { RefreshUserTokenDocument, SessionDocument } from './states/session/gql/session';

export function Session() {
    const { data: sessionData } = useQuery(SessionDocument);
    const [refreshUserToken] = useMutation(RefreshUserTokenDocument);

    return (
        <div>
            <span>Current user token: <b>{sessionData?.session.currentUserToken}</b> &nbsp;</span>
            <button onClick={() => refreshUserToken().catch(() => void 0)}>Refresh</button>
        </div>
    );
}
