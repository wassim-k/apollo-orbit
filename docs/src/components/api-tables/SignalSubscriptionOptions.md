| Property | Type | Description |
| --- | --- | --- |
| `subscription` | `DocumentNode \| TypedDocumentNode<TData, TVariables>` | A GraphQL document, often created with `gql` from the `graphql-tag`<br />package, that contains a single subscription inside of it. |
| `fetchPolicy?` | `FetchPolicy` | How you want your component to interact with the Apollo cache. For details, see [Setting a fetch policy](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy). |
| `errorPolicy?` | `ErrorPolicy` | Specifies the `ErrorPolicy` to be used for this operation |
| `context?` | `DefaultContext` | Shared context between your component and your network interface (Apollo Link). |
| `extensions?` | `Record<string, any>` | Shared context between your component and your network interface (Apollo Link). |
| `lazy?` | `boolean` | Whether to execute subscription immediately or lazily via `execute` method. |
| `onData?` | `(data: TData) => void` | Callback for when new data is received |
| `onComplete?` | `() => void` | Callback for when the subscription is completed |
| `onError?` | `(error: ErrorLike) => void` | Callback for when an error occurs |
| `injector?` | `Injector` | Custom injector to use for this subscription. |
| `variables?` | `() => TVariables \| undefined \| ` | A function or signal returning an object containing all of the GraphQL variables your operation requires to execute.<br /><br />Each key in the object corresponds to a variable name, and that key's value corresponds to the variable value.*<br /><br />When `null` is returned, the subscription will be terminated until a non-null value is returned again. |

