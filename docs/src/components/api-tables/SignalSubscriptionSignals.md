| Signal | Type | Description |
| --- | --- | --- |
| `result` | `Signal<SignalSubscriptionResult<TData>>` | The subscription result, containing `data`, `loading`, and `error`. |
| `loading` | `Signal<boolean>` | If `true`, the subscription is currently loading the initial result. |
| `data` | `Signal<TData \| undefined>` | The data returned by the subscription, or `undefined` if loading, errored, or no data received yet. |
| `error` | `Signal<ErrorLike \| undefined>` | An error object if the subscription failed, `undefined` otherwise. |
| `active` | `Signal<boolean>` | Whether the subscription is currently active, connected to the server and receiving real-time updates. |
| `enabled` | `Signal<boolean>` | Whether the subscription is currently enabled.<br /><br />This property starts as `true` for non-lazy subscriptions and `false` for lazy subscriptions.<br /><br />Calling `execute()` sets it to `true`, while calling `terminate()` sets it to `false`.<br /><br />When `true`:<br />- The subscription automatically starts when variables change from `null` to a non-null value<br />- Variable changes trigger re-subscription with the new variables<br /><br />When `false`:<br />- Variable changes are ignored and do not trigger re-subscription<br />- The subscription must be manually started via `execute()`<br /><br />Note: This is different from `active`, which indicates whether the subscription is currently connected to the server and receiving real-time updates. |

