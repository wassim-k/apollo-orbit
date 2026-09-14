| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<SignalMutationResult<TData, TErrorPolicy>>` | The mutation result, containing `data`, `loading`, `error` and `called`. |
| `loading` | `Signal<boolean>` | If `true`, the mutation is currently in flight. |
| `data` | `Signal<TData \| undefined>` | The data returned from the mutation. |
| `error` | `Signal<EffectiveMutateErrorPolicy<TErrorPolicy> extends 'ignore' ? undefined : ErrorLike \| undefined>` | The error encountered during the mutation. |
| `called` | `Signal<boolean>` | If `true`, the mutation's mutate method has been called. |

