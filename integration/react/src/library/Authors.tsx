import { useQuery, useSubscription } from '@apollo/client';
import { AuthorsDocument, NewAuthorDocument } from '../graphql';

export function Authors() {
  const { data: authorsData, loading: loadingAuthors } = useQuery(AuthorsDocument);
  const { data: newAuthorData } = useSubscription(NewAuthorDocument);

  return (
    <>
      <h3>Authors</h3>
      {newAuthorData && <div className="notification">New author added: <b>{newAuthorData.newAuthor.name}</b></div>}
      {loadingAuthors && <div>Loading...</div>}
      {authorsData?.authors.map(author =>
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
