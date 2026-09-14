| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<WatchFragmentResult<TData>>` | The fragment result, containing `data`, `complete`, and `missing`. |
| `data` | `Signal<WatchFragmentResult<TData>['data']>` | The data the cache holds for the fragment. Narrow `result` on `complete` to reach fully typed data. |
| `complete` | `Signal<boolean>` | `true` if all requested fields in the fragment are present in the cache, `false` otherwise. |
| `missing` | `Signal<MissingTree \| undefined>` | If `complete` is `false`, this field describes which fields are missing. |
| `variables` | `Signal<TVariables \| undefined>` | The variables the fragment is currently reading the cache with. |

