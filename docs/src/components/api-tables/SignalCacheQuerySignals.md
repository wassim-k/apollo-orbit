| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<CacheQueryResult<TData, TPartial, TRequired>>` | The cache query result, containing `data`, `complete`, and `missing`.<br />Narrow on `complete` to reach fully typed `data`. |
| `data` | `Signal<CacheQueryData<TData, TPartial, TRequired>>` | The data the cache holds for the query, or `null` if the cache does not hold all of it. With<br />`returnPartialData`, an incomplete read carries the fields the cache did have. A `required` query<br />throws instead of reporting either. |
| `complete` | `Signal<TRequired extends true ? true : boolean>` | `true` if all requested fields are present in the cache, `false` otherwise. |
| `missing` | `Signal<TRequired extends true ? undefined : MissingFieldError \| undefined>` | If `complete` is `false`, this field describes which fields are missing. |
| `variables` | `Signal<TVariables \| undefined>` | The variables the query is currently reading the cache with. |

