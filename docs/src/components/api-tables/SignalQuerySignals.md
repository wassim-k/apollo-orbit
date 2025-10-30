| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<QueryResult<TData, TStates>>` | The query result, containing `data`, `loading`, `error`, `networkStatus`, `previousData`, `dataState`. |
| `loading` | `Signal<boolean>` | If `true`, the query is currently in flight. |
| `networkStatus` | `Signal<NetworkStatus>` | The current network status of the query. |
| `data` | `Signal<GetData<TData, TStates> \| undefined>` | The data returned by the query, or `undefined` if loading, errored, or no data received yet. |
| `previousData` | `Signal<GetData<TData, TStates> \| undefined>` | The data from the previous successful result, useful for displaying stale data during refetches. |
| `error` | `Signal<ErrorLike \| undefined>` | An error object if the query failed, `undefined` otherwise. |
| `active` | `Signal<boolean>` | Whether the query is currently active, subscribed to the underlying observable and receiving cache updates. |
| `enabled` | `Signal<boolean>` | Whether the query is currently enabled.<br /><br />This property starts as `true` for non-lazy queries and `false` for lazy queries.<br /><br />Calling `execute()` sets it to `true`, while calling `terminate()` sets it to `false`.<br /><br />When `true`:<br />- The query automatically executes when variables change from `null` to a non-null value<br />- Variable changes trigger re-execution with the new variables<br /><br />When `false`:<br />- Variable changes are ignored and do not trigger re-execution<br />- The query must be manually started via `execute()`<br /><br />Note: This is different from `active`, which indicates whether the query is currently connected to its observable and actively watching the cache. |

