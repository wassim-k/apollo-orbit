import { useLazyQuery, useMutation } from '@apollo/client/react';
import { FormEvent, useEffect, useState } from 'react';
import { ADD_BOOK_MUTATION, AUTHORS_QUERY } from '../graphql';

export function NewBook({
  onClose
}: {
  onClose: () => void;
}) {
  const [addBook, { loading: submitting }] = useMutation(ADD_BOOK_MUTATION);
  const [getAuthors, authorsResult] = useLazyQuery(AUTHORS_QUERY, {
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache'
  });
  const [name, setName] = useState<string | undefined>();
  const [genre, setGenre] = useState<string | undefined>();
  const [authorId, setAuthorId] = useState<string | undefined>();

  useEffect(() => {
    if (authorsResult.data && authorsResult.data.authors.length > 0 && !authorId) {
      setAuthorId(authorsResult.data.authors[0].id);
    }
  }, [authorId, authorsResult.data]);

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!name || !authorId) return;
    addBook({
      variables: {
        book: { authorId, name, genre }
      }
    });
  };

  return (
    <>
      {submitting && <div>Submitting...</div>}
      <form onSubmit={handleSubmit} className="box">
        <div>
          <label>Name:&nbsp;</label>
          <input type="text" onChange={event => setName(event.target.value)} />
        </div>
        <div>
          <label>Genre:&nbsp;</label>
          <input type="text" onChange={event => setGenre(event.target.value)} />
        </div>

        {!authorsResult.called
          ? <div><button onClick={() => getAuthors()}>Load authors</button></div>
          : <>
            {authorsResult.loading && <div>Loading authors...</div>}
            {authorsResult.data && <div>
              <label>Author:&nbsp;</label>
              <select onChange={event => setAuthorId(event.target.value)}>
                {authorsResult.data.authors.map(author => <option key={author.id} value={author.id}>{author.name}</option>)}
              </select>
            </div>}
          </>}
        <br />
        <button disabled={!name || !authorId}>Submit</button>
        <button type="button" onClick={() => onClose()}>Close</button>
      </form>
    </>
  );
}
