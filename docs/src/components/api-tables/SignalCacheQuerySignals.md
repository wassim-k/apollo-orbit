| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<SignalCacheQueryResult<TData>>` | The cache query result, containing `data`, `complete`, and `missing`. |
| `data` | `Signal<TData>` | The data returned by the cache query. |
| `complete` | `Signal<boolean \| undefined>` | A signal indicating whether the query result contains complete data.<br />- `true`: All requested fields are available in the cache<br />- `false`: Some fields are missing from the cache<br />- `undefined`: Query has not been executed yet |
| `missing` | `Signal<unknown \| undefined>` | A signal containing an array of missing field errors if the query is incomplete.<br />Will be `undefined` if the query is complete or has not been executed. |

