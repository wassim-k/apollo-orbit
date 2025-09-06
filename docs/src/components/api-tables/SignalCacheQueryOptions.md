| Property | Type | Description |
| --- | --- | --- |
| `query` | `DocumentNode \| TypedDocumentNode<TData, TVariables>` | A GraphQL query document parsed into an AST by gql. |
| `variables?` | `NoInfer<TVariables> \| (() => NoInfer<TVariables>)` | An object containing all of the variables your query needs to execute.<br />Can be provided as a static object, a signal, or a function that returns the variables.<br />When provided as a function, it will be executed in a computed context and will<br />automatically re-execute the query when any reactive dependencies change. |
| `optimistic?` | `boolean` | If `true`, the query will be evaluated against both the optimistic cache layer<br />and the normal cache layer. This allows optimistic updates to be reflected<br />in the query results immediately.<br/>*@default*: `true` |
| `immediate?` | `boolean` |  |
| `returnPartialData?` | `boolean` | If set to `true`, the observable will emit the partial data that is available in the cache.<br />If set to `false`, the observable will throw an error if the complete data is not available in the cache.<br/>*@default*: `false` |
| `injector?` | `Injector` | Custom injector to use for this signal. |

