import { useQuery, useSubscription } from '@apollo/client/react';
import { AUTHORS_QUERY, NEW_AUTHOR_SUBSCRIPTION } from '../graphql';

export function Authors() {
  const { refetch, ...authorsResult } = useQuery(AUTHORS_QUERY);
  const { data: newAuthorData } = useSubscription(NEW_AUTHOR_SUBSCRIPTION);

  return (
    <>
      <h3>Authors <button className="link" onClick={() => refetch()}>⟳</button></h3>
      {newAuthorData && <div className="notification">New author added: <b>{newAuthorData.newAuthor.name}</b></div>}
      {authorsResult.loading && <div>Loading...</div>}
      {authorsResult.error && <div className="error-well">{authorsResult.error.message}</div>}
      {(authorsResult.data ?? authorsResult.previousData)?.authors.map(author =>
        <div key={author.id}>
          <span>{author.name}</span>
          <ul>
            {author.books.map(book => <li key={book.id}>{book.name}</li>)}
          </ul>
        </div >
      )}
    </>
  );
}
