import { ApolloOrbitProvider } from '@apollo-orbit/react';
import { Query } from '@apollo-orbit/react/components';
import { ApolloProvider } from '@apollo/client';
import './App.scss';
import { Theme } from './Theme';
import { ThemeDocument, client } from './graphql';
import { Library } from './library/Library';
import { authorState } from './library/states/author.state';
import { bookState } from './library/states/book.state';
import { themeState } from './states/theme';

function App() {
  return (
    <ApolloProvider client={client}>
      <ApolloOrbitProvider states={[authorState, bookState, themeState]}>
        <Query query={ThemeDocument}>
          {result =>
            <div className={`main ${result.data?.theme.name.toLowerCase()}`}>
              <Theme></Theme>
              <Library></Library>
            </div>
          }
        </Query>
      </ApolloOrbitProvider>
    </ApolloProvider>
  );
}

export default App;
