import { useLazyQuery, useMutation } from '@apollo-orbit/react';
import { FormEvent, useEffect, useState } from 'react';
import { AuthorsDocument } from './gql/author';
import { AddBookDocument } from './gql/book';

export function NewBook({
  onClose
}: {
  onClose: () => void;
}) {
  const [addBook, { loading: submitting }] = useMutation(AddBookDocument);
  const [getAuthors, { data: authorsData, loading: loadingAuthors }] = useLazyQuery(AuthorsDocument);
  const [name, setName] = useState<string | undefined>();
  const [genre, setGenre] = useState<string | undefined>();
  const [authorId, setAuthorId] = useState<string | undefined>();

  useEffect(() => {
    if (authorsData && authorsData.authors.length > 0 && !authorId) {
      setAuthorId(authorsData.authors[0].id);
    }
  }, [authorId, authorsData]);

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

        {!authorsData && <div><button onClick={() => getAuthors()}>Load authors</button></div>}
        {loadingAuthors && <div>Loading authors...</div>}
        {authorsData && <div>
          <label>Author:&nbsp;</label>
          <select onChange={event => setAuthorId(event.target.value)}>
            {authorsData.authors.map(author => <option key={author.id} value={author.id}>{author.name}</option>)}
          </select>
        </div>}
        <br />
        <input style={{ margin: '0 0.25em' }} type="submit" value="Submit" disabled={!name || !authorId} />
        <button style={{ margin: '0 0.25em' }} onClick={() => onClose()}>Close</button>
      </form>
    </>
  );
}
