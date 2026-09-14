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
| `variables?` | `() => TVariables \| undefined \| null` | The operation's variables, as a function or signal re-read whenever its reactive dependencies change.<br /><br />Returning `null` terminates the operation until it returns a non-null value again. |

