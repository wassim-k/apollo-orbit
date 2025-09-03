import { useMutation } from '@apollo/client/react';
import { FormEvent, useState } from 'react';
import { ADD_AUTHOR_MUTATION } from '../graphql';

export function NewAuthor({
  onClose
}: {
  onClose: () => void;
}) {
  const [name, setName] = useState<string | undefined>();
  const [age, setAge] = useState<number | undefined>();
  const [addAuthor, { loading: submitting }] = useMutation(ADD_AUTHOR_MUTATION, {
    onError: () => void 0
  });

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!name) return;
    addAuthor({
      variables: {
        author: { name, age }
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
          <label>Age:&nbsp;</label>
          <input type="text" onChange={event => setAge(event.target.valueAsNumber)} />
        </div>
        <br />
        <button disabled={!name}>Submit</button>
        <button type="button" onClick={() => onClose()}>Close</button>
      </form>
    </>
  );
}
