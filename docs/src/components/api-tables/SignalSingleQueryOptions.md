| Property | Type | Description |
| --- | --- | --- |
| `query` | `DocumentNode \| TypedDocumentNode<TData, TVariables>` | A GraphQL query string parsed into an AST with the gql template literal. |
| `errorPolicy?` | `ErrorPolicy` | Specifies how the query handles a response that returns both GraphQL errors and partial results.<br /><br />For details, see [GraphQL error policies](https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies).<br /><br />The default value is `none`, meaning that the query result includes error details but not partial results. |
| `context?` | `DefaultContext` | If you're using [Apollo Link](https://www.apollographql.com/docs/react/api/link/introduction/), this object is the initial value of the `context` object that's passed along your link chain. |
| `fetchPolicy?` | `FetchPolicy` | Specifies how the query interacts with the Apollo Client cache during execution (for example, whether it checks the cache for results before sending a request to the server).<br /><br />For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy).<br /><br />The default value is `cache-first`. |
| `notifyOnLoading?` | `boolean` | Whether or not to track initial network loading status.<br/>*@default*: `true` |
| `lazy?` | `boolean` | Whether to execute query immediately or lazily via `execute` method. |
| `injector?` | `Injector` | Custom injector to use for this query. |
| `variables?` | `() => TVariables \| undefined \| ` | A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.<br /><br />Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.<br /><br />When `null` is returned, the operation will be terminated until a non-null value is returned again. |

