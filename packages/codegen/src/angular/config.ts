import { ApolloOrbitPluginConfig, ApolloOrbitRawPluginConfig } from '../config';

export interface ApolloOrbitAngularConfig extends ApolloOrbitPluginConfig {
    queryObservable?: boolean;
}

export interface ApolloOrbitAngularRawConfig extends ApolloOrbitRawPluginConfig {
    /**
     * @name importFromCore
     * @type boolean
     * @description Import from `@apollo-orbit/angular/core`
     * @default false
     */
    importFromCore?: boolean;

    /**
     * @name queryObservable
     * @type boolean
     * @description Export helper QueryObservable type for each query.
     * @default true
     */
    queryObservable?: boolean;
}
