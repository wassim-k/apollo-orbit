import { useQuery } from '@apollo/client';
import { Theme } from './Theme';
import { ThemeDocument } from './graphql';
import { Library } from './library/Library';

export function Main() {
  const { data } = useQuery(ThemeDocument);
  return <div className={`main ${data?.theme.name.toLowerCase()}`}>
    <Theme></Theme>
    <Library></Library>
  </div>;
}
