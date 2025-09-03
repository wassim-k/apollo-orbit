import { useQuery } from '@apollo/client/react';
import { BOOKS_QUERY } from '../graphql';

export function Books() {
  const { refetch, ...booksResult } = useQuery(BOOKS_QUERY, { notifyOnNetworkStatusChange: true });

  return (
    <>
      <h3>Books <button className="link" onClick={() => refetch()}>⟳</button></h3>
      {booksResult.loading && <div>Loading...</div>}
      {booksResult.error && <div className="error-well">{booksResult.error.message}</div>}
      {(booksResult.data ?? booksResult.previousData)?.books.map(book =>
        <div key={book.id}>
          <span>{book.displayName}</span>
        </div >
      )}
    </>
  );
}
