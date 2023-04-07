import { useQuery } from '@apollo-orbit/react';
import { BooksDocument } from '../graphql';

export function Books() {
    const { data: booksData, loading: loadingBooks } = useQuery(BooksDocument);

    return (
        <>
            <h3>Books</h3>
            {loadingBooks && <div>Loading...</div>}
            {booksData?.books.map(book =>
                <div key={book.id}>
                    <span>{book.displayName}</span>
                </div >
            )}
        </>
    );
}
