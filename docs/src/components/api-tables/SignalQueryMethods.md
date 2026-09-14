| Method | Description |
| --- | --- |
| `execute(execOptions?: SignalQueryExecOptions<TVariables>)` | Execute the query with the provided options. |
| `terminate()` | Terminate query execution and unsubscribe from the observable. |
| `refetch(variables?: Partial<TVariables>)` | Refetch the query, optionally with new variables.<br /><br />Inherits the query's `errorPolicy`, so its result narrows the same way `execute` does. |
| `fetchMore<TFetchData, TFetchVars, TFetchErrorPolicy>(options: FetchMoreOptions<TData, TVariables, TFetchData, TFetchVars> & { errorPolicy?: TFetchErrorPolicy })` | Fetch more data and merge it with the existing result.<br /><br />Rejects when the fetch fails, as `ObservableQuery.fetchMore` does, and leaves the result signals alone.<br /><br />Unlike a refetch it carries its own `errorPolicy`, so its result narrows against `none` rather than the<br />ambient default. |
| `updateQuery(mapFn: UpdateQueryMapFn<TData, TVariables>)` | Update the query's cached data. |
| `startPolling(pollInterval: number)` | Start polling the query. |
| `stopPolling()` | Stop polling the query. |
| `subscribeToMore<TSubscriptionData, TSubscriptionVariables>(options: SubscribeToMoreOptions<TData, TSubscriptionVariables, TSubscriptionData, TVariables>)` | Subscribe to more data.<br /><br />The registration belongs to the current execution. Terminating the query, or pausing it by returning<br />`null` from `variables`, drops it, and resuming registers a fresh observable with no handlers. |

