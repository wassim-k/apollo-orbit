| Method | Description |
| --- | --- |
| `execute(execOptions?: SignalQueryExecOptions<TVariables>)` | Execute the query with the provided options.<br /><br />Superseding or terminating an execution aborts its request; the promise follows `errorPolicy` either way. |
| `terminate()` | Terminate the query, cancelling any in-flight execution and ignoring further variable changes. |

