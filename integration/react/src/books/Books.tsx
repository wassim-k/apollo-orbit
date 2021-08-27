import { useQuery, useSubscription } from '@apollo-orbit/react';
import React, { Suspense, useState } from 'react';
import { AuthorsDocument, NewAuthorDocument } from './gql/author';
import { BooksDocument } from './gql/book';
import './Books.scss';
import { NewAuthor } from './NewAuthor';
import { NewBook } from './NewBook';

const Lazy = React.lazy(() => import('../lazy/Lazy'));

export function Books() {
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isAddingAuthor, setIsAddingAuthor] = useState(false);
  const [showLazy, setShowLazy] = useState(false);
  const { data: booksData, loading: loadingBooks } = useQuery(BooksDocument);
  const { data: authorsData, loading: loadingAuthors } = useQuery(AuthorsDocument);
  const { data: newAuthorData } = useSubscription(NewAuthorDocument);

  return (
    <>
      {newAuthorData && <div className="notification">New author added: <b>{newAuthorData.newAuthor.name}</b></div>}
      <h3>Books</h3>
      {loadingBooks && <div>Loading...</div>}
      {booksData?.books.map(book =>
        <div key={book.id}>
          <span>{book.displayName}</span>
        </div >
      )}
      <br />
      <button onClick={() => setIsAddingBook(true)}>Add Book</button>
      {isAddingBook && <div className="form-container">
        <NewBook onClose={() => setIsAddingBook(false)}></NewBook>
      </div>}

      <h3>Authors</h3>
      {loadingAuthors && <div>Loading...</div>}
      {authorsData?.authors.map(author =>
        <div key={author.id}>
          <span>{author.name}</span>
        </div >
      )}
      <br />
      <button onClick={() => setIsAddingAuthor(true)}>Add Author</button>
      {isAddingAuthor && <div className="form-container">
        <NewAuthor onClose={() => setIsAddingAuthor(false)}></NewAuthor>
      </div>}
      <br />
      <br />
      {!showLazy && <button onClick={() => setShowLazy(true)}>Go to lazy</button>}
      {showLazy && <button onClick={() => setShowLazy(false)}>Go back</button>}
      {showLazy && <div>
        <Suspense fallback={<div>Loading...</div>}>
          <Lazy />
        </Suspense>
      </div>}
    </>
  );
}
