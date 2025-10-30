| Property | Type | Description |
| --- | --- | --- |
| `fetchPolicy?` | `WatchQueryFetchPolicy` | Specifies how the query interacts with the Apollo Client cache during execution (for example, whether it checks the cache for results before sending a request to the server).<br /><br />For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy).<br /><br />The default value is `cache-first`. |
| `initialFetchPolicy?` | `WatchQueryFetchPolicy` | Defaults to the initial value of options.fetchPolicy, but can be explicitly<br />configured to specify the WatchQueryFetchPolicy to revert back to whenever<br />variables change (unless nextFetchPolicy intervenes). |
| `refetchWritePolicy?` | `RefetchWritePolicy` | Specifies whether a `NetworkStatus.refetch` operation should merge<br />incoming field data with existing data, or overwrite the existing data.<br />Overwriting is probably preferable, but merging is currently the default<br />behavior, for backwards compatibility with Apollo Client 3.x. |
| `errorPolicy?` | `ErrorPolicy` | Specifies how the query handles a response that returns both GraphQL errors and partial results.<br /><br />For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).<br /><br />The default value is `none`, meaning that the query result includes error details but not partial results. |
| `context?` | `DefaultContext` | If you're using [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/), this object is the initial value of the `context` object that's passed along your link chain. |
| `pollInterval?` | `number` | Specifies the interval (in milliseconds) at which the query polls for updated results.<br /><br />The default value is `0` (no polling). |
| `notifyOnNetworkStatusChange?` | `boolean` | If `true`, the in-progress query's associated component re-renders whenever the network status changes or a network error occurs.<br /><br />The default value is `true`. |
| `returnPartialData?` | `boolean` | If `true`, the query can return partial results from the cache if the cache doesn't contain results for all queried fields.<br /><br />The default value is `false`. |
| `skipPollAttempt?` | `() => boolean` | A callback function that's called whenever a refetch attempt occurs<br />while polling. If the function returns `true`, the refetch is<br />skipped and not reattempted until the next poll interval. |
| `query` | `DocumentNode \| TypedDocumentNode<TData, TVariables>` | A GraphQL query string parsed into an AST with the gql template literal. |
| `notifyOnLoading?` | `boolean` | Whether or not to track initial network loading status.<br/>*@default*: `true` |
| `lazy?` | `boolean` | Whether to execute query immediately or lazily via `execute` method. |
| `injector?` | `Injector` | Custom injector to use for this query. |
| `variables?` | `() => TVariables \| undefined \| ` | A function or signal returning an object containing all of the GraphQL variables your query requires to execute.<br /><br />Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.<br /><br />When `null` is returned, the query will be terminated until a non-null value is returned again. |

