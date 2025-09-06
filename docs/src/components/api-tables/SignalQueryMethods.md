| Method | Description |
| --- | --- |
| `execute(execOptions: SignalQueryExecOptions<TVariables>)` | Execute the query with the provided options. |
| `terminate()` | Terminate query execution and unsubscribe from the observable. |
| `refetch(variables?: Partial<TVariables>)` | Refetch the query with the current variables. |
| `fetchMore<TFetchData, TFetchVars>(options: FetchMoreOptions<TData, TVariables, TFetchData, TFetchVars>)` | Fetch more data and merge it with the existing result. |
| `updateQuery(mapFn: UpdateQueryMapFn<TData, TVariables>)` | Update the query's cached data. |
| `startPolling(pollInterval: number)` | Start polling the query. |
| `stopPolling()` | Stop polling the query. |
| `subscribeToMore<TSubscriptionData, TSubscriptionVariables>(options: SubscribeToMoreOptions<TData, TSubscriptionVariables, TSubscriptionData, TVariables>)` | Subscribe to more data. |

