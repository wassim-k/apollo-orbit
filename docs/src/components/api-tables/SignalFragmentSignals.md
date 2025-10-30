| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<SignalFragmentResult<TData>>` | The fragment result, containing `data`, `complete`, and `missing`. |
| `data` | `Signal<DeepPartial<TData>>` | The data returned by the fragment. |
| `complete` | `Signal<boolean>` | `true` if all requested fields in the fragment are present in the cache, `false` otherwise. |
| `missing` | `Signal<MissingTree \| undefined>` | If `complete` is `false`, this field describes which fields are missing. |

