| Property | Type | Description |
| --- | --- | --- |
| `query` | `DocumentNode \| TypedDocumentNode<TData, TVariables>` | A GraphQL query document parsed into an AST by gql. |
| `optimistic?` | `boolean` | If `true`, the query is evaluated against the optimistic cache layer as well as the normal one, so<br />optimistic updates show up immediately.<br/>*@default*: `true` |
| `returnPartialData?` | `TPartial` | If `true`, an incomplete read carries the partial data the cache holds rather than `data: null`,<br />and widens `data` to match. `complete` is `false` either way.<br/>*@default*: `false` |
| `injector?` | `Injector` | Custom injector to use for this signal. |
| `variables?` | `() => TVariables \| undefined` | The operation's variables, as a function or signal re-read whenever its reactive dependencies change. |

