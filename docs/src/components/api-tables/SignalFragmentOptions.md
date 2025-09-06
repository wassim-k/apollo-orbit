| Property | Type | Description |
| --- | --- | --- |
| `fragment` | `DocumentNode \| TypedDocumentNode<TData, TVariables>` | A GraphQL fragment document parsed into an AST with the `gql`<br />template literal. |
| `from` | `\| string`<br />`\| Reference`<br />`\| StoreObject`<br />`\| (() => string \| Reference \| StoreObject)` | An object containing a `__typename` and primary key fields<br />(such as `id`) identifying the entity object from which the fragment will<br />be retrieved, or a `{ __ref: "..." }` reference, or a `string` ID<br />(uncommon). |
| `variables?` | `NoInfer<TVariables> \| (() => NoInfer<TVariables>)` | Any variables that the GraphQL fragment may depend on. |
| `fragmentName?` | `string` | The name of the fragment defined in the fragment document.<br /><br />Required if the fragment document includes more than one fragment,<br />optional otherwise. |
| `optimistic?` | `boolean` | If `true`, `watchFragment` returns optimistic results.<br /><br />The default value is `true`. |
| `injector?` | `Injector` | Custom injector to use for this signal. |

