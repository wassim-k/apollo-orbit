| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<SignalMutationResult<TData>>` | The mutation result, containing `data`, `loading`, and `error` and `called`. |
| `loading` | `Signal<boolean>` | If `true`, the mutation is currently in flight. |
| `data` | `Signal<TData \| undefined>` | The data returned from the mutation. |
| `error` | `Signal<ErrorLike \| undefined>` | The error encountered during the mutation. |
| `called` | `Signal<boolean>` | If `true`, the mutation's mutate method has been called. |

